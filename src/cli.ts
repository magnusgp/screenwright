import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config/loadConfig";
import { loadFlow } from "./flows/loadFlow";
import { createRunDirectory } from "./runs/createRunDirectory";
import { reviewFlow } from "./reviewer/reviewFlow";
import { runFlow } from "./runner/runFlow";
import { logger } from "./utils/logger";

const CONFIG_FILE = "screenwright.config.yaml";
const EXAMPLE_FLOW = path.join("examples", "flows", "onboarding.flow.yaml");

const CONFIG_TEMPLATE = `app:
  url: http://localhost:3000
  viewport:
    width: 1280
    height: 800

artifacts:
  output_dir: screenwright-runs

auth:
  storage_state_path: user-flows/auth.storage.json
`;

const FLOW_TEMPLATE = `name: onboarding
description: Basic onboarding flow for a sample app.

app:
  url: http://localhost:3000
  viewport:
    width: 1280
    height: 800

persona:
  role: founder
  company_stage: early-stage
  expertise: medium
  goal: create an account and reach the dashboard
  tolerance: low

review:
  focus:
    - clarity
    - navigation
    - trust
  output_language: english

steps:
  - name: open-home
    action:
      goto: /
    expect:
      screenshot: true
      reviewer_question: >
        What do you think this page is for, and what would you click next?

  - name: click-sign-up
    action:
      click: "text=Sign up"
    expect:
      screenshot: true
      reviewer_question: >
        Is it clear what information will be needed to sign up?
`;

async function writeFileIfAllowed(filePath: string, content: string, force: boolean): Promise<boolean> {
  const resolvedPath = path.resolve(filePath);

  try {
    await fs.access(resolvedPath);
    if (!force) {
      return false;
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw new Error(`Failed to access ${resolvedPath}`);
    }
  }

  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content, "utf8");
  return true;
}

async function handleInit(force: boolean) {
  const created: string[] = [];
  const skipped: string[] = [];

  const configCreated = await writeFileIfAllowed(CONFIG_FILE, CONFIG_TEMPLATE, force);
  if (configCreated) {
    created.push(CONFIG_FILE);
  } else {
    skipped.push(CONFIG_FILE);
  }

  const flowCreated = await writeFileIfAllowed(EXAMPLE_FLOW, FLOW_TEMPLATE, force);
  if (flowCreated) {
    created.push(EXAMPLE_FLOW);
  } else {
    skipped.push(EXAMPLE_FLOW);
  }

  logger.info("Initialized Screenwright.");

  for (const file of created) {
    logger.info(`Created: ${file}`);
  }

  for (const file of skipped) {
    logger.warn(`Skipped (exists): ${file}`);
  }
}

async function handleRun(flowPath: string) {
  const config = await loadConfig(CONFIG_FILE);
  const flow = await loadFlow(flowPath);
  const runDirectory = await createRunDirectory({
    baseDir: config.artifacts.output_dir,
    flowName: flow.name
  });

  const personaRole = flow.persona?.role ?? "unspecified";
  const runPath = path.relative(process.cwd(), runDirectory.path) || runDirectory.path;

  logger.info(`Flow name: ${flow.name}`);
  logger.info(`App URL: ${flow.app.url}`);
  logger.info(`Persona role: ${personaRole}`);
  logger.info(`Number of steps: ${flow.steps.length}`);
  logger.info(`Run directory: ${runPath}`);
  logger.info("Executing steps:");

  const summary = await runFlow({
    flow,
    runDir: runDirectory.path,
    storageStatePath: config.auth?.storage_state_path
  });

  logger.info("Reviewing screens:");

  const reviewSummary = await reviewFlow({
    flow,
    flowPath,
    runDir: runDirectory.path,
    model: config.reviewer?.model
  });

  const findingsPath =
    path.relative(process.cwd(), reviewSummary.findingsPath) || reviewSummary.findingsPath;

  logger.info("Run complete.");
  logger.info(`Steps executed: ${summary.stepsExecuted}`);
  logger.info(`Screenshots captured: ${summary.screenshotsCaptured}`);
  logger.info(`Findings: ${findingsPath}`);
  logger.info(`Run directory: ${runPath}`);
}

export function buildCli() {
  const program = new Command();

  program.name("screenwright").description("CLI-first UI critique runner.");

  program
    .command("init")
    .description("Create starter config and flow files")
    .option("--force", "Overwrite existing files")
    .action(async (options: { force?: boolean }) => {
      await handleInit(Boolean(options.force));
    });

  program
    .command("run")
    .description("Run a flow and capture evidence")
    .argument("<flow>", "Path to a flow YAML file")
    .action(async (flowPath: string) => {
      await handleRun(flowPath);
    });

  return program;
}
