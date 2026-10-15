// Placeholder until the generators land (#12, #13, #14).
// `generate` writes nothing yet, so CI's drift gate
// (`pnpm codegen` + `git diff --exit-code`) stays green and activates
// automatically once the generators write files.
const command = process.argv[2] ?? 'generate';

if (command === 'generate') {
  console.log("codegen: no generators yet (issues #12, #13, #14) — 'generate' is a no-op");
  process.exit(0);
}

console.error(`codegen: unknown command '${command}'`);
process.exit(1);
