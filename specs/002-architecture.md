# Screenwright Architecture (MVP)

## Goals

- Provide a clear separation between CLI, config/flow loading, runner, reviewer, and report generation.
- Keep modules testable and composable for later phases.
- Ensure output artifacts are deterministic and easy to diff.

## Non-goals

- Hosted service or multi-user database.
- Browser extension or UI dashboard.

## Components

1. CLI
   - Parses commands and flags.
   - Orchestrates high-level steps.
   - Handles error reporting and exit codes.

2. Config loader
   - Reads screenwright.config.yaml.
   - Merges with environment variables.
   - Validates with Zod.

3. Flow loader
   - Reads flow YAML.
   - Validates with Zod.
   - Normalizes step names and actions.

4. Runner (Phase 2)
   - Uses Playwright Chromium.
   - Executes flow steps in order.
   - Produces raw evidence per step.

5. Evidence capture
   - Screenshots per step.
   - DOM snapshot per step.
   - Console logs and network errors.

6. Reviewer client (Phase 3)
   - Builds prompt per screen.
   - Sends to provider adapter.
   - Validates response.

7. Report generator (Phase 4)
   - Writes findings.json.
   - Generates report.md, tasks.md, agent-prompt.md.

8. Compare (Phase 5)
   - Reads two runs and compares findings.

## Data flow

1. CLI loads config.
2. CLI loads and validates flow.
3. CLI creates run directory.
4. Runner executes steps and captures evidence.
5. Reviewer produces findings from evidence.
6. Report generator writes outputs.

## Module boundaries

- src/cli.ts: command definitions and argument parsing.
- src/config/*: config schema and loader.
- src/flows/*: flow schema and loader.
- src/runs/*: run directory creation and naming.
- src/runner/*: Playwright execution and evidence capture.
- src/reviewer/*: provider adapters and schema validation.
- src/reports/*: findings.json, report.md, tasks.md, agent-prompt.md.

## Artifact layout

```text
screenwright-runs/
  2026-05-03-onboarding/
    screenshots/
    dom/
    logs/
    findings.json
    report.md
    tasks.md
    agent-prompt.md
```

## Error handling

- Validation errors should name the failing file and field.
- Runtime errors should include the step name when possible.
- Non-zero exit codes should follow the CLI contract in specs/003-cli-contract.md.
