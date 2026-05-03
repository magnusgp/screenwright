import fs from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { parse as parseYaml } from "yaml";
import { formatZodError } from "../utils/formatZodError";
import { flowSchema, type FlowDefinition } from "./schema";

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
    return flowSchema.parse(raw ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid flow file: ${resolvedPath}\n${formatZodError(error)}`);
    }
    throw error;
  }
}
