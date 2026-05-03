# Screenwright Flow File Format

## Overview

Flow files are YAML documents that define the app under review, the target persona, and the step-by-step actions to execute.

String values may include environment variable placeholders like `${VAR_NAME}`. Screenwright substitutes these at runtime and errors if a referenced variable is missing.

Top-level fields:

- name (required)
- description (optional)
- app (required)
- persona (optional but recommended)
- review (optional)
- steps (required)

## Schema

```yaml
name: string
description: string

app:
  url: string
  viewport:
    width: number
    height: number

persona:
  role: string
  company_stage: string
  expertise: string
  goal: string
  tolerance: string

review:
  focus:
    - string
  output_language: string

steps:
  - name: string
    action:
      goto: string
      # or click: string
      # or fill: [{ selector: string, value: string }]
      # or wait_for: string
      # or press: string
      # or select: { selector: string, value: string }
      # or screenshot: true
    expect:
      screenshot: boolean
      reviewer_question: string
```

## Action rules

- `goto`: accepts an absolute URL or a path. If a path starts with `/`, it is resolved against `app.url`.
- `click`: Playwright selector string.
- `fill`: array of { selector, value } pairs.
- `wait_for`: selector or text selector for Playwright to wait on.
- `press`: key string (example: Enter).
- `select`: { selector, value } for select inputs.
- `screenshot`: forces a capture even if `expect.screenshot` is false.

## Step naming

- Use short, unique names.
- Names are used in artifact file names.

## Example

```yaml
name: onboarding

app:
  url: http://localhost:3000
  viewport:
    width: 1280
    height: 800

persona:
  role: founder
  company_stage: early-stage
  expertise: medium
  goal: create an account and reach the dashboard
  tolerance: low

review:
  focus:
    - clarity
    - navigation
    - trust
  output_language: english

steps:
  - name: open-home
    action:
      goto: /
    expect:
      screenshot: true
      reviewer_question: >
        What do you think this page is for, and what would you click next?

  - name: click-sign-up
    action:
      click: "text=Sign up"
    expect:
      screenshot: true
      reviewer_question: >
        Is it clear what information will be needed to sign up?
```
