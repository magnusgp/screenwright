# Prompt: Add Playwright Runner

You are implementing Phase 2 of Screenwright.

Read:

- README.md
- specs/001-mvp-spec.md
- specs/002-architecture.md
- specs/003-cli-contract.md
- specs/004-flow-file-format.md

Implement the Playwright flow runner. The CLI should execute real browser steps and capture evidence, but should not call any LLM yet.

## Goal

Add Playwright execution so `screenwright run <flow>` actually runs the flow and writes evidence to the run directory.

## Requirements

- Add Playwright dependency.
- Use Chromium and the flow viewport settings.
- Support actions: `goto`, `click`, `fill`, `wait_for`, `press`, `select`, `screenshot`.
- Capture a screenshot after each step when `expect.screenshot` is true, or when the action is `screenshot`.
- Capture a DOM snapshot after each step when screenshots are captured.
- Capture console logs and network errors for the full run.
- Write artifacts under the run directory defined in specs/001-mvp-spec.md.
- Step names should be slugified for file names.

## Logging

Print a short summary at the end:

- Number of steps executed
- Number of screenshots captured
- Run directory

## Definition of done

- `screenwright run <flow>` executes a basic flow with Playwright.
- Screenshots and DOM snapshots appear in the run directory.
- Console and network logs are written to disk.

## Anti-implementation

Do not:

- Add LLM calls.
- Generate findings or reports.
- Add multi-agent review.
- Change the CLI contract.
