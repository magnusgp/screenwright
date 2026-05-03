# Project Guidelines

## Code Style

- Use TypeScript with async/await and explicit types where helpful.
- Validate external inputs with Zod before use.
- Keep CLI output human-readable and concise.

## Architecture

- CLI commands live in src/cli.ts and are invoked by src/index.ts.
- Config and flow parsing live under src/config and src/flows.
- Run directory creation lives under src/runs.
- Specs and prompts in specs/ and prompts/ are the source of truth.

## Build and Test

- npm install
- npm run dev -- <command>
- npm run build

## Conventions

- Prefer ASCII in repo files unless a spec requires otherwise.
- Errors should cite the failing file and validation field when possible.
