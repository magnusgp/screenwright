# Screenwright Product Brief

## Summary

Screenwright is an agentic UI review harness for coding-agent workflows.

It helps developers validate whether a target user can understand and complete a web-app flow. The developer provides a flow file, a persona, and an LLM API key. Screenwright runs the flow with Playwright, captures UI evidence, asks an AI reviewer for structured critique, and writes implementation-ready tasks for a coding agent.

## Problem

Developers using coding agents can build UI quickly, but the resulting product often has unclear flows, weak information hierarchy, missing states, vague copy, and broken assumptions.

Manual review is slow:

1. Run the app.
2. Click through the flow.
3. Take screenshots.
4. Ask an AI or human for feedback.
5. Convert feedback into implementation tasks.
6. Ask a coding agent to fix it.
7. Repeat.

Screenwright turns this into a repeatable command.

## Target user

Primary user:

- Developer, founder, or product engineer building a web-app MVP
- Uses coding agents such as Codex, Claude Code, Cursor, or Copilot
- Wants fast UX critique without setting up a full user-testing process

Secondary user:

- Product designer or product manager reviewing early flows
- Compliance/product teams validating workflow clarity

## Core value proposition

Screenwright makes UI review repeatable, evidence-based, and directly actionable for coding agents.

It does not just say "improve UX." It produces structured findings with:

- Screen name
- Screenshot evidence
- Severity
- Category
- User impact
- Suggested fix
- Implementation hint
- Acceptance criteria
- Anti-implementation guidance

## Positioning

Screenwright is not a replacement for real user testing.

It is a first-pass agentic UI critique tool for catching obvious flow, copy, trust, accessibility, and implementation issues before human review.

## Tagline

Run your app like a user. Review it like a product team. Fix it with an agent.
