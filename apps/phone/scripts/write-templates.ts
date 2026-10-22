import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../src/lib/templates';

const outputDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
mkdirSync(outputDir, { recursive: true });
for (const [file, content] of Object.entries(TEMPLATES)) {
  writeFileSync(join(outputDir, file), content);
}
console.log(`templates: wrote ${Object.keys(TEMPLATES).join(', ')}`);
