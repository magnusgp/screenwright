import { z } from "zod";

export const findingSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.string().min(1),
  title: z.string().min(1),
  evidence: z.string().min(1),
  user_impact: z.string().min(1),
  suggested_fix: z.string().min(1),
  implementation_hint: z.string().min(1),
  acceptance_criteria: z.array(z.string().min(1)).min(1),
  anti_implementation: z.array(z.string().min(1)).min(1)
});

export const screenReviewSchema = z.object({
  screen: z.string().min(1),
  summary: z.string().min(1),
  findings: z.array(findingSchema),
  next_action_prediction: z.string().optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const findingsFileSchema = z.object({
  flow: z.object({
    name: z.string().min(1),
    file: z.string().min(1),
    run_id: z.string().min(1),
    app_url: z.string().url()
  }),
  generated_at: z.string().min(1),
  screens: z.array(screenReviewSchema)
});

export type ScreenReview = z.infer<typeof screenReviewSchema>;
export type FindingsFile = z.infer<typeof findingsFileSchema>;
