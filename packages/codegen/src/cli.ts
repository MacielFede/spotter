import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allSchemaTargets, domainGenDir, domainSchemaTarget, emitJsonSchemas } from './emit.js';
import { runQuicktype } from './quicktype.js';
import { emitThemes, themeGenDir, themeTargets } from './theme.js';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const domainPackageDir = join(packageDir, '..', 'domain');
const jsonSchemaDir = join(domainGenDir, 'json-schema');
const swiftDir = join(domainGenDir, 'swift');
const kotlinDir = join(domainGenDir, 'kotlin');
const kotlinPackage = 'app.spotter.domain';

const generate = (): void => {
  if (!existsSync(join(domainPackageDir, 'package.json'))) {
    throw new Error(`codegen: expected the domain package at ${domainPackageDir}`);
  }

  for (const dir of [jsonSchemaDir, swiftDir, kotlinDir]) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }

  const emitted = emitJsonSchemas();
  for (const { file } of allSchemaTargets) {
    writeFileSync(join(jsonSchemaDir, file), emitted[file] ?? '');
  }

  const combinedSchemaPath = join(jsonSchemaDir, domainSchemaTarget.file);
  runQuicktype([
    '--src-lang',
    'schema',
    '--lang',
    'swift',
    '--top-level',
    'Domain',
    '--out',
    join(swiftDir, 'Domain.swift'),
    combinedSchemaPath,
  ]);
  runQuicktype([
    '--src-lang',
    'schema',
    '--lang',
    'kotlin',
    '--package',
    kotlinPackage,
    '--top-level',
    'Domain',
    '--out',
    join(kotlinDir, 'Domain.kt'),
    combinedSchemaPath,
  ]);

  rmSync(themeGenDir, { recursive: true, force: true });
  const themes = emitThemes();
  for (const { file } of themeTargets) {
    const out = join(themeGenDir, file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, themes[file] ?? '');
  }
};

const command = process.argv[2] ?? 'generate';

if (command === 'generate') {
  generate();
  process.exit(0);
}

console.error(`codegen: unknown command '${command}'`);
process.exit(1);
