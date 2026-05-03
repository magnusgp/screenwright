import fs from "node:fs/promises";
import path from "node:path";
import { slugify } from "../utils/slugify";

export type RunDirectory = {
  id: string;
  path: string;
};

type RunDirectoryOptions = {
  baseDir: string;
  flowName: string;
  now?: Date;
};

export async function createRunDirectory(options: RunDirectoryOptions): Promise<RunDirectory> {
  const now = options.now ?? new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const slug = slugify(options.flowName);
  const nonce = Math.random().toString(36).slice(2, 6);
  const runId = `${timestamp}-${slug}-${nonce}`;

  const baseDir = path.resolve(options.baseDir);
  const runDir = path.join(baseDir, runId);

  await fs.mkdir(path.join(runDir, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(runDir, "dom"), { recursive: true });
  await fs.mkdir(path.join(runDir, "logs"), { recursive: true });

  return { id: runId, path: runDir };
}
