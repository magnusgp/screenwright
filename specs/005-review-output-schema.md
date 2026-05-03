# Screenwright Review Output Schema

## Output file

The reviewer writes a single file per run: findings.json.

## Top-level structure

```json
{
  "flow": {
    "name": "onboarding",
    "file": "examples/flows/example-onboarding.flow.yaml",
    "run_id": "2026-05-03-onboarding",
    "app_url": "http://localhost:3000"
  },
  "generated_at": "2026-05-03T12:00:00Z",
  "screens": [
    {
      "screen": "open-home",
      "summary": "The page looks like a marketing site with a primary sign-up path.",
      "findings": [],
      "next_action_prediction": "I would click Sign up.",
      "confidence": 0.82
    }
  ]
}
```

## Screen object

- `screen` (string, required): step name.
- `summary` (string, required): one or two sentences.
- `findings` (array, required): list of findings.
- `next_action_prediction` (string, optional).
- `confidence` (number, optional): 0.0 to 1.0.

## Finding object

Each finding must include:

- `severity` (string): one of `low`, `medium`, `high`, `critical`.
- `category` (string): example values include `clarity`, `navigation`, `copy`, `hierarchy`, `trust`, `accessibility`, `missing_state`, `friction`, `compliance`, `error_handling`, `performance`, `other`.
- `title` (string): short, action-oriented title.
- `evidence` (string): cite visible UI evidence and reference screenshot or DOM paths when possible.
- `user_impact` (string): impact on the target user.
- `suggested_fix` (string): what to change in the UI.
- `implementation_hint` (string): component or area to edit.
- `acceptance_criteria` (array of strings).
- `anti_implementation` (array of strings).

## Validation

- Reviewer output must be valid JSON.
- Reject and retry once if validation fails.
- Any missing required fields should be reported with a clear error message.
