# Screenwright

Screenwright is a CLI-first developer tool for automated UI and user-flow critique.

It runs browser flows with Playwright, captures screenshots and page evidence, sends each screen to an AI reviewer, and generates implementation-ready tasks for coding agents.

Screenwright is designed for developers building web applications with AI coding agents. It replaces manual screenshot-by-screenshot UX review with a repeatable flow that produces structured, evidence-based findings.

## Core idea

A developer defines a user flow:

```bash
screenwright run examples/flows/onboarding.flow.yaml
```

Screenwright then:

1. Opens the app in a browser.
2. Executes the flow step by step.
3. Captures screenshots, DOM snapshots, console logs, and network errors.
4. Reviews each screen from the perspective of a target persona.
5. Writes structured findings.
6. Generates coding-agent-ready tasks.

## MVP scope

The MVP is a local CLI tool. It is not a hosted web app.

MVP features:

- YAML flow files
- Playwright-based browser execution
- Screenshot capture
- DOM snapshot capture
- Console and network error capture
- Single LLM reviewer
- Structured JSON findings
- Markdown report
- Coding-agent-ready task output

## Non-goals for MVP

- Hosted dashboard
- Multi-agent consensus
- Automatic source-code editing
- CI integration
- Visual regression testing
- Legal/compliance correctness guarantees
