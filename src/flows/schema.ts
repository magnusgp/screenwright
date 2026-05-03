import { z } from "zod";

const viewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

const fillEntrySchema = z.object({
  selector: z.string().min(1),
  value: z.string()
});

const selectSchema = z.object({
  selector: z.string().min(1),
  value: z.string()
});

const actionSchema = z
  .object({
    goto: z.string().optional(),
    click: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    fill: z.array(fillEntrySchema).optional(),
    wait_for: z.string().optional(),
    wait_for_url: z.string().optional(),
    press: z.string().optional(),
    select: selectSchema.optional(),
    screenshot: z.boolean().optional()
  })
  .refine((action) => Object.values(action).some((value) => value !== undefined), {
    message: "Action must include at least one supported action."
  });

const stepSchema = z.object({
  name: z.string().min(1),
  action: actionSchema,
  expect: z
    .object({
      screenshot: z.boolean().optional(),
      reviewer_question: z.string().optional()
    })
    .optional()
});

export const flowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  app: z.object({
    url: z.string().url(),
    viewport: viewportSchema.optional()
  }),
  persona: z
    .object({
      role: z.string().min(1),
      company_stage: z.string().optional(),
      expertise: z.string().optional(),
      goal: z.string().optional(),
      tolerance: z.string().optional()
    })
    .optional(),
  review: z
    .object({
      focus: z.array(z.string()).optional(),
      output_language: z.string().optional()
    })
    .optional(),
  steps: z.array(stepSchema).min(1)
});

export type FlowDefinition = z.infer<typeof flowSchema>;
export type FlowStep = z.infer<typeof stepSchema>;
export type FlowAction = z.infer<typeof actionSchema>;
