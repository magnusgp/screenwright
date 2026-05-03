import { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  return error.errors
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("\n");
}
