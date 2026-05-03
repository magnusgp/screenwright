import fs from "node:fs/promises";
import path from "node:path";
import type { FlowDefinition, FlowStep } from "../flows/schema";
import { getStepArtifactPrefix } from "../runs/artifacts";
import { formatZodError } from "../utils/formatZodError";
import { logger } from "../utils/logger";
import {
  findingsFileSchema,
  screenReviewSchema,
  type FindingsFile,
  type ScreenReview
} from "./schema";
import { requestOpenAIChatCompletion, type OpenAIContentPart } from "./openaiClient";
import { ZodError } from "zod";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_DOM_CHARS = 20000;

export type ReviewFlowOptions = {
  flow: FlowDefinition;
  flowPath: string;
  runDir: string;
  model?: string;
};

export type ReviewSummary = {
  findingsPath: string;
};

function buildSystemPrompt(): string {
  return [
    "You are an expert UX and product reviewer for developer tools.",
    "Return JSON only.",
    "Do not wrap JSON in markdown fences.",
    "Use the exact screen name provided.",
    "Each finding must include acceptance_criteria and anti_implementation arrays."
  ].join(" ");
}

function buildUserPrompt(options: {
  screen: string;
  persona: string;
  goal?: string;
  focus?: string[];
  reviewerQuestion?: string;
  evidenceList: string[];
  domSnapshot?: string;
}): string {
  const focusList = options.focus && options.focus.length > 0 ? options.focus.join(", ") : "general UX";

  const promptLines = [
    `Screen: ${options.screen}`,
    `Persona role: ${options.persona}`,
    options.goal ? `Persona goal: ${options.goal}` : undefined,
    `Review focus: ${focusList}`,
    options.reviewerQuestion ? `Reviewer question: ${options.reviewerQuestion}` : undefined,
    options.evidenceList.length > 0
      ? `Evidence files:\n${options.evidenceList.map((line) => `- ${line}`).join("\n")}`
      : "Evidence files: none",
    options.domSnapshot
      ? `DOM snapshot (truncated):\n${options.domSnapshot}`
      : undefined,
    "Return a JSON object with fields: screen, summary, findings, next_action_prediction, confidence.",
    "Each finding must include: severity, category, title, evidence, user_impact, suggested_fix, implementation_hint, acceptance_criteria, anti_implementation."
  ].filter(Boolean);

  return promptLines.join("\n\n");
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const withoutFence = trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
    return withoutFence.trim();
  }

  return trimmed;
}

async function readTextIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function readBase64IfExists(filePath: string): Promise<string | undefined> {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.toString("base64");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}\n...[truncated]`;
}

function shouldCapture(step: FlowStep): boolean {
  return step.expect?.screenshot === true || step.action.screenshot === true;
}

async function reviewScreen(options: {
  apiKey: string;
  model: string;
  flow: FlowDefinition;
  step: FlowStep;
  stepNumber: number;
  totalSteps: number;
  runDir: string;
}): Promise<ScreenReview> {
  const filePrefix = getStepArtifactPrefix(options.stepNumber, options.totalSteps, options.step.name);
  const screenshotPath = path.join(options.runDir, "screenshots", `${filePrefix}.png`);
  const domPath = path.join(options.runDir, "dom", `${filePrefix}.html`);

  const screenshotBase64 = shouldCapture(options.step)
    ? await readBase64IfExists(screenshotPath)
    : undefined;
  const domSnapshot = shouldCapture(options.step) ? await readTextIfExists(domPath) : undefined;

  const evidenceList: string[] = [];
  if (screenshotBase64) {
    evidenceList.push(`screenshot: ${path.relative(options.runDir, screenshotPath)}`);
  }
  if (domSnapshot) {
    evidenceList.push(`dom: ${path.relative(options.runDir, domPath)}`);
  }

  const userPrompt = buildUserPrompt({
    screen: options.step.name,
    persona: options.flow.persona?.role ?? "unspecified",
    goal: options.flow.persona?.goal,
    focus: options.flow.review?.focus,
    reviewerQuestion: options.step.expect?.reviewer_question,
    evidenceList,
    domSnapshot: domSnapshot ? truncate(domSnapshot, MAX_DOM_CHARS) : undefined
  });

  const contentParts: OpenAIContentPart[] = [{ type: "text", text: userPrompt }];
  if (screenshotBase64) {
    contentParts.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${screenshotBase64}`
      }
    });
  }

  const responseText = await requestOpenAIChatCompletion(options.apiKey, {
    model: options.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: contentParts }
    ]
  });

  const jsonText = extractJson(responseText);
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Invalid JSON response for ${options.step.name}`);
  }

  try {
    return screenReviewSchema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid response schema for ${options.step.name}\n${formatZodError(error)}`);
    }
    throw error;
  }
}

async function reviewScreenWithRetry(
  options: Parameters<typeof reviewScreen>[0]
): Promise<ScreenReview> {
  try {
    return await reviewScreen(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Review failed for ${options.step.name}. Retrying once. ${message}`);
    return await reviewScreen(options);
  }
}

export async function reviewFlow(options: ReviewFlowOptions): Promise<ReviewSummary> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const flowFile = path.relative(process.cwd(), path.resolve(options.flowPath));

  const screens: ScreenReview[] = [];

  for (const [index, step] of options.flow.steps.entries()) {
    const stepNumber = index + 1;
    logger.info(`Reviewing ${stepNumber}. ${step.name}`);

    const review = await reviewScreenWithRetry({
      apiKey,
      model,
      flow: options.flow,
      step,
      stepNumber,
      totalSteps: options.flow.steps.length,
      runDir: options.runDir
    });

    screens.push(review);
  }

  const findings: FindingsFile = {
    flow: {
      name: options.flow.name,
      file: flowFile,
      run_id: path.basename(options.runDir),
      app_url: options.flow.app.url
    },
    generated_at: new Date().toISOString(),
    screens
  };

  findingsFileSchema.parse(findings);

  const findingsPath = path.join(options.runDir, "findings.json");
  await fs.writeFile(findingsPath, JSON.stringify(findings, null, 2), "utf8");

  return { findingsPath };
}
