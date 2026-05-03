# Screenwright CLI Contract

## Command summary

```text
screenwright init [--force]
screenwright run <flow>
```

## Global behavior

- Working directory is the project root.
- Default config file: screenwright.config.yaml (CWD).
- Default runs directory: screenwright-runs/ (CWD).

## screenwright init

Purpose: create starter config and example flow files.

Flags:

- --force: overwrite existing files.

Exit codes:

- 0 success
- 1 failure (unable to write)

## screenwright run <flow>

Purpose: execute a flow and generate artifacts.

Inputs:

- <flow> path to YAML flow file.

Behavior:

1. Load .env if present.
2. Load screenwright.config.yaml.
3. Load and validate flow YAML.
4. Create run directory.
5. Run flow (Phase 2+).
6. Write artifacts.

MVP outputs: run directory and plan summary.

Planned flags (post-scaffold):

- --config <path>
- --runs-dir <path>
- --dry-run (no browser, only validation)

Exit codes:

- 0 success
- 1 unexpected error
- 2 config error
- 3 flow validation error
- 4 runtime error (browser, network)

## Environment variables

- OPENAI_API_KEY (Phase 3)
- SCREENWRIGHT_LOG_LEVEL (optional)

## Logging

- Default: human readable.
- Future: --json for structured logs (not MVP).
