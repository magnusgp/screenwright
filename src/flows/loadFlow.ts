import fs from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { parse as parseYaml } from "yaml";
import { formatZodError } from "../utils/formatZodError";
import { flowSchema, type FlowDefinition } from "./schema";

const ENV_PATTERN = /\$\{([A-Z0-9_]+)\}/g;

function formatPath(pathParts: Array<string | number>): string {
  if (pathParts.length === 0) {
    return "root";
  }

  return pathParts
    .map((part, index) => (typeof part === "number" ? `[${part}]` : index === 0 ? part : `.${part}`))
    .join("");
}

function expandEnv(value: unknown, filePath: string, pathParts: Array<string | number> = []): unknown {
  if (typeof value === "string") {
    return value.replace(ENV_PATTERN, (_match, varName: string) => {
      const envValue = process.env[varName];
      if (envValue === undefined) {
        const pathLabel = formatPath(pathParts);
        throw new Error(
          `Missing environment variable ${varName} referenced in ${filePath} at ${pathLabel}`
        );
      }
      return envValue;
    });
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => expandEnv(item, filePath, [...pathParts, index]));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const expanded: Record<string, unknown> = {};

    for (const [key, entryValue] of entries) {
      expanded[key] = expandEnv(entryValue, filePath, [...pathParts, key]);
    }

    return expanded;
  }

  return value;
}

export async function loadFlow(flowPath: string): Promise<FlowDefinition> {
  const resolvedPath = path.resolve(flowPath);
  let raw: unknown;

  try {
    const file = await fs.readFile(resolvedPath, "utf8");
    raw = parseYaml(file) ?? {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new Error(`Flow file not found: ${resolvedPath}`);
    }
    throw new Error(`Failed to read flow file: ${resolvedPath}`);
  }

  try {
    const expanded = expandEnv(raw ?? {}, resolvedPath);
    return flowSchema.parse(expanded);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid flow file: ${resolvedPath}\n${formatZodError(error)}`);
    }
    throw error;
  }
}
