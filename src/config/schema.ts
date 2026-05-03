import { z } from "zod";

export const viewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

export const configSchema = z
  .object({
    app: z
      .object({
        url: z.string().url(),
        viewport: viewportSchema.optional()
      })
      .optional(),
    artifacts: z
      .object({
        output_dir: z.string().min(1)
      })
      .default({
        output_dir: "screenwright-runs"
      })
  })
  .default({
    artifacts: {
      output_dir: "screenwright-runs"
    }
  });

export type ScreenwrightConfig = z.infer<typeof configSchema>;
