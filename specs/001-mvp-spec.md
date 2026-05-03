# Screenwright MVP Specification

## MVP goal

Build a CLI tool that can run a scripted browser flow, capture evidence at each step, review each screen with one AI reviewer, and generate coding-agent-ready implementation tasks.

## Primary user story

As a developer building an MVP with coding agents, I want to run an automated review over a specific user flow, so that I can identify confusing screens, missing states, broken affordances, and unclear copy before handing fixes back to my coding agent.

## MVP command

```bash
screenwright run examples/flows/onboarding.flow.yaml
```

## MVP inputs

Screenwright accepts:

- A YAML flow file
- A config file
- Environment variable for provider API key

Example:

```bash
OPENAI_API_KEY=...
screenwright run examples/flows/onboarding.flow.yaml
```

## MVP outputs

For each run, Screenwright creates an artifact folder:

```text
screenwright-runs/
	2026-05-03-onboarding/
		screenshots/
			01-open-home.png
			02-click-sign-up.png
		dom/
			01-open-home.html
			02-click-sign-up.html
		logs/
			console.json
			network-errors.json
		findings.json
		report.md
		tasks.md
		agent-prompt.md
```

## Core flow

1. Load config.
2. Load and validate flow YAML.
3. Launch Playwright Chromium.
4. Execute each flow step.
5. Capture screenshot after each step.
6. Capture DOM snapshot after each step.
7. Capture console logs and network errors.
8. Send screen evidence to AI reviewer.
9. Validate AI response against schema.
10. Write findings.
11. Generate markdown report.
12. Generate coding-agent-ready tasks.

## Required flow actions

MVP supports:

- `goto`
- `click`
- `fill`
- `wait_for`
- `press`
- `select`
- `screenshot`

## Required review fields

Each finding must include:

- `severity`
- `category`
- `title`
- `evidence`
- `user_impact`
- `suggested_fix`
- `implementation_hint`
- `acceptance_criteria`
- `anti_implementation`

## Definition of done

The MVP is done when:

- A developer can install and run the CLI locally.
- `screenwright init` creates starter config and example flow files.
- `screenwright run <flow>` executes a simple browser flow.
- Screenshots and DOM snapshots are written to disk.
- A single AI reviewer returns structured findings.
- Invalid reviewer output is rejected or retried.
- `findings.json`, `report.md`, `tasks.md`, and `agent-prompt.md` are generated.
- The generated `tasks.md` can be pasted into a coding agent with minimal editing.

## Anti-implementation

Do not:

- Build a hosted dashboard.
- Add multi-agent consensus.
- Automatically modify source code.
- Add CI mode.
- Add authentication to Screenwright itself.
- Create vague reports without implementation tasks.
- Overfit the MVP to one web framework.
- Require users to write raw Playwright code for basic flows.
