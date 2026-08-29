// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Write, or check, the compiled token artifacts (OMN-16886).
 *
 * ```
 * npm run compile:tokens   # write src/generated/tokens/**
 * npm run check:tokens     # compare the checked-in files to a fresh compile
 * ```
 *
 * `check:tokens` is gate **G1A.3**. It runs inside the required `build` job, so
 * hand-editing a compiled token value fails the build rather than being noticed
 * by a reviewer — Operating Rule #5, and the direct answer to Stall 2, where a
 * token pipeline guarded a file nothing used for four months while four values
 * silently drifted.
 *
 * The check compares **bytes**, not a recorded checksum. A checksum file can be
 * updated in the same commit as the hand-edit; the source cannot.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compileCatalog, type ThemeCatalogCapture } from '../src/tokens/compile.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(REPO_ROOT, 'themes', 'theme-catalog.capture.json');

function loadCapture(): ThemeCatalogCapture {
  const raw = JSON.parse(readFileSync(SOURCE, 'utf8')) as ThemeCatalogCapture;
  return { catalog: raw.catalog, instances: raw.instances };
}

function digest(contents: string): string {
  return createHash('sha256').update(contents, 'utf8').digest('hex');
}

function write(): void {
  const { artifacts } = compileCatalog(loadCapture());
  for (const artifact of artifacts) {
    const target = join(REPO_ROOT, artifact.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, artifact.contents, 'utf8');
    process.stdout.write(`  ${artifact.path}  sha256:${digest(artifact.contents)}\n`);
  }
  process.stdout.write(`compiled ${String(artifacts.length)} artifacts\n`);
}

function check(): number {
  const { artifacts } = compileCatalog(loadCapture());
  const drifted: string[] = [];
  for (const artifact of artifacts) {
    const target = join(REPO_ROOT, artifact.path);
    let onDisk: string;
    try {
      onDisk = readFileSync(target, 'utf8');
    } catch {
      drifted.push(`${artifact.path}: missing — never compiled, or deleted`);
      continue;
    }
    if (onDisk !== artifact.contents) {
      drifted.push(
        `${artifact.path}: checked in sha256:${digest(onDisk)}, ` +
          `fresh compile sha256:${digest(artifact.contents)}`,
      );
    }
  }
  if (drifted.length > 0) {
    process.stderr.write(
      'Compiled token artifacts disagree with a fresh compile of their source.\n' +
        'A compiled artifact is never hand-edited. To change a token VALUE, publish a\n' +
        'new theme instance revision upstream, recapture, and run `npm run compile:tokens`.\n\n' +
        `${drifted.map((line) => `  - ${line}`).join('\n')}\n`,
    );
    return 1;
  }
  process.stdout.write(
    `token artifacts match a fresh compile (${String(artifacts.length)} files)\n`,
  );
  return 0;
}

const mode = process.argv[2] ?? 'write';
if (mode === 'check') {
  process.exit(check());
} else if (mode === 'write') {
  write();
} else {
  process.stderr.write(`usage: compile-tokens.ts [write|check]\n`);
  process.exit(2);
}
