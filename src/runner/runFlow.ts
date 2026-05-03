import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import type { FlowAction, FlowDefinition, FlowStep } from "../flows/schema";
import { getStepArtifactPrefix } from "../runs/artifacts";
import { logger } from "../utils/logger";

type RunFlowOptions = {
  flow: FlowDefinition;
  runDir: string;
};

type ConsoleEntry = {
  time: string;
  type: string;
  text: string;
  location?: {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
};

type NetworkErrorEntry = {
  time: string;
  url: string;
  method: string;
  failure: string;
  resourceType?: string;
};

export type RunSummary = {
  stepsExecuted: number;
  screenshotsCaptured: number;
  runDir: string;
};

function resolveGotoUrl(baseUrl: string, target: string): string {
  if (/^https?:\/\//i.test(target)) {
    return target;
  }

  return new URL(target, baseUrl).toString();
}

function shouldCapture(step: FlowStep): boolean {
  return step.expect?.screenshot === true || step.action.screenshot === true;
}

function describeAction(action: FlowAction): string {
  const parts: string[] = [];

  if (action.goto) {
    parts.push(`goto ${action.goto}`);
  }

  if (action.fill) {
    parts.push(`fill ${action.fill.length} field${action.fill.length === 1 ? "" : "s"}`);
  }

  if (action.select) {
    parts.push(`select ${action.select.selector}`);
  }

  if (action.click) {
    parts.push(`click ${action.click}`);
  }

  if (action.press) {
    parts.push(`press ${action.press}`);
  }

  if (action.wait_for) {
    parts.push(`wait_for ${action.wait_for}`);
  }

  if (action.screenshot) {
    parts.push("screenshot");
  }

  return parts.join(", ") || "(no action)";
}

async function executeStepAction(page: Page, baseUrl: string, step: FlowStep) {
  const { action } = step;

  if (action.goto) {
    const targetUrl = resolveGotoUrl(baseUrl, action.goto);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  }

  if (action.fill) {
    for (const entry of action.fill) {
      await page.fill(entry.selector, entry.value);
    }
  }

  if (action.select) {
    await page.selectOption(action.select.selector, action.select.value);
  }

  if (action.click) {
    await page.click(action.click);
  }

  if (action.press) {
    await page.keyboard.press(action.press);
  }

  if (action.wait_for) {
    await page.waitForSelector(action.wait_for, { state: "visible" });
  }
}

export async function runFlow(options: RunFlowOptions): Promise<RunSummary> {
  const { flow, runDir } = options;

  const consoleEntries: ConsoleEntry[] = [];
  const networkErrors: NetworkErrorEntry[] = [];

  const browser = await chromium.launch();
  const viewport = flow.app.viewport ?? { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  page.on("console", (message) => {
    consoleEntries.push({
      time: new Date().toISOString(),
      type: message.type(),
      text: message.text(),
      location: message.location()
    });
  });

  page.on("pageerror", (error) => {
    consoleEntries.push({
      time: new Date().toISOString(),
      type: "pageerror",
      text: error.message
    });
  });

  page.on("requestfailed", (request) => {
    networkErrors.push({
      time: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? "unknown",
      resourceType: request.resourceType()
    });
  });

  let screenshotsCaptured = 0;
  let stepsExecuted = 0;
  let runError: Error | null = null;

  try {
    for (const [index, step] of flow.steps.entries()) {
      const stepNumber = index + 1;
      logger.info(`${stepNumber}. ${step.name} - ${describeAction(step.action)}`);

      try {
        await executeStepAction(page, flow.app.url, step);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Step failed (${step.name}): ${message}`);
      }

      stepsExecuted += 1;

      if (shouldCapture(step)) {
        const filePrefix = getStepArtifactPrefix(stepNumber, flow.steps.length, step.name);
        const screenshotPath = path.join(runDir, "screenshots", `${filePrefix}.png`);
        const domPath = path.join(runDir, "dom", `${filePrefix}.html`);

        await page.screenshot({ path: screenshotPath, fullPage: true });
        const html = await page.content();
        await fs.writeFile(domPath, html, "utf8");

        screenshotsCaptured += 1;
      }
    }
  } catch (error) {
    runError = error instanceof Error ? error : new Error(String(error));
  }

  try {
    const logDir = path.join(runDir, "logs");
    const consolePath = path.join(logDir, "console.json");
    const networkPath = path.join(logDir, "network-errors.json");

    await fs.writeFile(
      consolePath,
      JSON.stringify({ generated_at: new Date().toISOString(), entries: consoleEntries }, null, 2),
      "utf8"
    );

    await fs.writeFile(
      networkPath,
      JSON.stringify({ generated_at: new Date().toISOString(), entries: networkErrors }, null, 2),
      "utf8"
    );
  } catch (error) {
    if (!runError) {
      runError = error instanceof Error ? error : new Error(String(error));
    }
  } finally {
    await context.close();
    await browser.close();
  }

  if (runError) {
    throw runError;
  }

  return {
    stepsExecuted,
    screenshotsCaptured,
    runDir
  };
}
