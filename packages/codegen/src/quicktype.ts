import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const quicktypeBin = require.resolve('quicktype/dist/index.js');

/** Runs the pinned local quicktype (ADR 0045) with Node, forwarding stdio. */
export const runQuicktype = (args: string[]): void => {
  execFileSync(process.execPath, [quicktypeBin, ...args], { stdio: 'inherit' });
};
