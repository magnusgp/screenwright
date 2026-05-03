import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import type { FlowAction, FlowDefinition, FlowStep } from "../flows/schema";
import { getStepArtifactPrefix } from "../runs/artifacts";
import { logger } from "../utils/logger";

type RunFlowOptions = {
  flow: FlowDefinition;
  runDir: string;
  storageStatePath?: string;
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

function isAuthPath(value?: string): boolean {
  if (!value) {
    return false;
  }

  return value.includes("/login") || value.includes("/signup");
}

function isAuthUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return isAuthPath(parsed.pathname);
  } catch {
    return false;
  }
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
    const clicks = Array.isArray(action.click) ? action.click : [action.click];
    parts.push(clicks.length === 1 ? `click ${clicks[0]}` : `click ${clicks.length} targets`);
  }

  if (action.press) {
    parts.push(`press ${action.press}`);
  }

  if (action.wait_for) {
    parts.push(`wait_for ${action.wait_for}`);
  }

  if (action.wait_for_url) {
    parts.push(`wait_for_url ${action.wait_for_url}`);
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
    const clicks = Array.isArray(action.click) ? action.click : [action.click];
    for (const selector of clicks) {
      await page.click(selector);
    }
  }

  if (action.press) {
    await page.keyboard.press(action.press);
  }

  if (action.wait_for) {
    await page.waitForSelector(action.wait_for, { state: "visible" });
  }

  if (action.wait_for_url) {
    const targetUrl = resolveGotoUrl(baseUrl, action.wait_for_url);
    await page.waitForURL(targetUrl);
  }
}

export async function runFlow(options: RunFlowOptions): Promise<RunSummary> {
  const { flow, runDir, storageStatePath } = options;

  const consoleEntries: ConsoleEntry[] = [];
  const networkErrors: NetworkErrorEntry[] = [];

  if (storageStatePath) {
    try {
      await fs.access(storageStatePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        throw new Error(`Auth storage state not found: ${storageStatePath}`);
      }
      throw error;
    }
  }

  const browser = await chromium.launch();
  const viewport = flow.app.viewport ?? { width: 1280, height: 800 };
  const context = await browser.newContext({
    viewport,
    ...(storageStatePath ? { storageState: storageStatePath } : {})
  });
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

      if (storageStatePath && isAuthUrl(page.url()) && !isAuthPath(step.action.goto)) {
        throw new Error(`Auth required: redirected to ${page.url()}`);
      }

      stepsExecuted += 1;

      if (shouldCapture(step)) {
        try {
          await page.waitForLoadState("networkidle", { timeout: 5000 });
        } catch {
          // Ignore network idle timeouts for chatty apps.
        }

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
