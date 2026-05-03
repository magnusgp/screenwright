#!/usr/bin/env node

import { buildCli } from "./cli";

async function main() {
  const program = buildCli();
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
