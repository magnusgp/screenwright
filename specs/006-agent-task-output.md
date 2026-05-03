# Screenwright Agent Task Output

## Purpose

The tasks file translates findings into implementation-ready work for a coding agent.

## tasks.md format

```md
# Screenwright Tasks: <flow-name>

## Context

Flow reviewed: <flow-file>
Persona: <persona role>
Goal: <persona goal>

## High-priority findings

### 1. <short title>

Severity: High
Screen: <step name>

Problem:
<one paragraph>

Implementation:
<one paragraph>

Acceptance criteria:
- <criterion>
- <criterion>

Anti-implementation:
- <do not do>
- <do not do>
```

## Ordering rules

- Sort by severity: critical, high, medium, low.
- Within the same severity, keep original screen order.

## agent-prompt.md format

This file is a ready-to-paste instruction for a coding agent.

Minimum sections:

- Context (flow, persona, app URL)
- High-priority tasks (copied from tasks.md)
- Definition of done
- Anti-implementation notes

## report.md format

Report is a human-readable summary. It should:

- Describe the flow and persona
- Summarize key findings and themes
- Link to evidence paths
- Point to tasks.md for implementation details
