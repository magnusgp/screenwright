# Prompt: Generate a Screenwright Flow File

You are generating a Screenwright flow YAML that can be run with the Screenwright CLI.

Read:

- specs/004-flow-file-format.md

## Goal

Produce a complete flow file in YAML that a developer can run immediately.

## Instructions

1. Inspect the repo for app routes, pages, and components to infer realistic flow steps.
2. If any required details are unknown (selectors, URLs, authentication), ask concise questions.
3. Prefer stable selectors (data-testid) when available. Otherwise use text selectors.
4. Include reviewer questions that match the persona and the screen purpose.
5. Use only supported actions: goto, click, fill, wait_for, press, select, screenshot.
6. Keep step names short, unique, and slug-friendly.

## Required content

Your YAML must include:

- name
- description
- app.url and app.viewport
- persona (role, goal, tolerance)
- review (focus, output_language)
- steps with action and expect blocks

## Output format

- Output ONLY the YAML file contents.
- Do not wrap in markdown or code fences.
- Place the file at: examples/flows/<flow-name>.flow.yaml

## Flow authoring checklist

- Cover the critical path for the persona goal.
- Include at least one form fill step if the flow is data-entry heavy.
- Use reviewer_question on every step.
- Ensure every goto path is valid for the app.
- Avoid placeholders like "TODO" unless explicitly approved.
