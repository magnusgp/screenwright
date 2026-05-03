import fs from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { parse as parseYaml } from "yaml";
import { formatZodError } from "../utils/formatZodError";
import { configSchema, type ScreenwrightConfig } from "./schema";

export async function loadConfig(
  configPath = "screenwright.config.yaml"
): Promise<ScreenwrightConfig> {
  const resolvedPath = path.resolve(configPath);
  let raw: unknown;

  try {
    const file = await fs.readFile(resolvedPath, "utf8");
    raw = parseYaml(file) ?? {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new Error(`Config file not found: ${resolvedPath}`);
    }
    throw new Error(`Failed to read config file: ${resolvedPath}`);
  }

  try {
    return configSchema.parse(raw ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid config file: ${resolvedPath}\n${formatZodError(error)}`);
    }
    throw error;
  }
}
