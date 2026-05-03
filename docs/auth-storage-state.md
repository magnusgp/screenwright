# Auth Storage State

Screenwright can reuse a Playwright storage state to avoid scripted logins.

## Why use this

- Avoid brittle login selectors.
- Keep credentials out of flow files.
- Reuse a session across runs.

## Create a storage state file

Use Playwright to log in once and save the session.

```bash
bunx playwright open http://localhost:3000/login --save-storage=user-flows/auth.storage.json
```

Log in in the opened browser window. Close the window when you are done.

## Configure Screenwright

Set the storage state in your config:

```yaml
auth:
  storage_state_path: user-flows/auth.storage.json
```

## Run the flow

```bash
bun run dev -- run user-flows/epok-core-flow.flow.yaml
```

If you need to refresh auth, delete the storage file and repeat the login step.
