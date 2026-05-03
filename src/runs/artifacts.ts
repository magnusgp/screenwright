import { slugify } from "../utils/slugify";

export function getStepArtifactPrefix(
  stepNumber: number,
  totalSteps: number,
  stepName: string
): string {
  const width = Math.max(2, String(totalSteps).length);
  const padded = String(stepNumber).padStart(width, "0");

  return `${padded}-${slugify(stepName)}`;
}
