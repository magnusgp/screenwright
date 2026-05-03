import fs from "node:fs/promises";
import path from "node:path";

export type RunDirectory = {
  id: string;
  path: string;
};

type RunDirectoryOptions = {
  baseDir: string;
  flowName: string;
  now?: Date;
};

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "run";
}

export async function createRunDirectory(options: RunDirectoryOptions): Promise<RunDirectory> {
  const now = options.now ?? new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const slug = slugify(options.flowName);
  const runId = `${dateStamp}-${slug}`;

  const baseDir = path.resolve(options.baseDir);
  const runDir = path.join(baseDir, runId);

  await fs.mkdir(path.join(runDir, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(runDir, "dom"), { recursive: true });
  await fs.mkdir(path.join(runDir, "logs"), { recursive: true });

  return { id: runId, path: runDir };
}
