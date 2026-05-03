# Prompt: Add Reviewer Client

You are implementing Phase 3 of Screenwright.

Read:

- README.md
- specs/001-mvp-spec.md
- specs/002-architecture.md
- specs/005-review-output-schema.md

Implement a single reviewer client and write findings.json. Do not generate report.md or tasks.md yet.

## Goal

After running a flow, send screen evidence to one LLM provider and write validated findings.json.

## Requirements

- Add a reviewer module with a provider adapter (OpenAI first).
- Read the API key from OPENAI_API_KEY.
- Build a prompt per screen with persona, review focus, reviewer question, and evidence references.
- Send the screenshot and DOM snapshot when available.
- Validate responses against the schema in specs/005-review-output-schema.md using Zod.
- Retry once on invalid JSON or schema failure.
- Write findings.json in the run directory.

## Implementation notes

- Keep the provider adapter isolated so other providers can be added later.
- Return clear errors when the API key is missing.
- Preserve the original screen order in the output.

## Definition of done

- A completed run produces findings.json.
- Invalid output is retried once and then reported as an error.

## Anti-implementation

Do not:

- Add multi-agent consensus.
- Generate report.md or tasks.md yet.
- Add a hosted service or UI.
