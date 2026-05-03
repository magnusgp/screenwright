# Prompt: Scaffold Screenwright CLI

You are implementing the first phase of Screenwright.

Read:

- `README.md`
- `specs/000-product-brief.md`
- `specs/001-mvp-spec.md`

Implement only the repository scaffold and CLI skeleton.

## Goal

Create a TypeScript CLI project that can be installed locally and run these commands:

```bash
screenwright init
screenwright run examples/flows/onboarding.flow.yaml
```

At this phase, `run` should load and validate the flow file, create an artifact directory, and print the planned steps. It should not launch Playwright yet and should not call an LLM yet.

## Technical requirements

Use:

- TypeScript
- Node.js
- Commander for CLI
- Zod for schema validation
- yaml for YAML parsing
- dotenv for environment variables
- tsx for local development

## Implement

Create:

```text
package.json
tsconfig.json
src/
	index.ts
	cli.ts
	config/
		loadConfig.ts
		schema.ts
	flows/
		loadFlow.ts
		schema.ts
	runs/
		createRunDirectory.ts
	utils/
		logger.ts
examples/
	flows/
		onboarding.flow.yaml
screenwright.config.yaml
```

## CLI behavior

### `screenwright init`

Creates:

- `screenwright.config.yaml`
- `examples/flows/onboarding.flow.yaml`

If files already exist, do not overwrite them unless `--force` is passed.

### `screenwright run <flow>`

Should:

1. Load `.env` if present.
2. Load `screenwright.config.yaml`.
3. Load and validate the provided flow YAML.
4. Create a run directory under `screenwright-runs/`.
5. Print a clean summary:

	 - Flow name
	 - App URL
	 - Persona role
	 - Number of steps
	 - Run directory
6. Print each planned step.

## Definition of done

- `npm install` works.
- `npm run dev -- init` works.
- `npm run dev -- run examples/flows/onboarding.flow.yaml` works.
- Invalid YAML gives a useful error.
- Missing flow file gives a useful error.
- Existing init files are not overwritten by default.
- The code is organized so Playwright and LLM review can be added later.

## Anti-implementation

Do not:

- Add Playwright yet.
- Add OpenAI or other LLM SDKs yet.
- Generate reports yet.
- Implement multi-agent review.
- Add a web UI.
- Add tests unless the scaffold is already complete and simple tests are cheap.
