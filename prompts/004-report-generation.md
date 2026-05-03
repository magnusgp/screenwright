# Prompt: Generate Reports and Tasks

You are implementing Phase 4 of Screenwright.

Read:

- README.md
- specs/005-review-output-schema.md
- specs/006-agent-task-output.md

Implement report generation from findings.json.

## Goal

Generate human-readable and coding-agent-ready outputs after findings.json exists.

## Requirements

- Read findings.json from a run directory.
- Generate report.md, tasks.md, and agent-prompt.md.
- Sort findings by severity (critical, high, medium, low).
- Group findings by screen.
- Link to evidence paths under the run directory.
- Keep output deterministic.

## Definition of done

- report.md summarizes the run and key themes.
- tasks.md follows the format in specs/006-agent-task-output.md.
- agent-prompt.md is ready to paste into a coding agent.

## Anti-implementation

Do not:

- Change reviewer output formats.
- Add additional LLM calls.
- Add multi-agent consensus.
