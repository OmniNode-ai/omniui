// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Every generated artifact in the repo is declared (OMN-16888).
 *
 * `npm run check:generated`. Runs inside the required `build` job.
 *
 * This is the complete half of `generated-artifact-parity`. The ESLint rule
 * reports inline but only on files ESLint can lint, and ESLint 9 has no CSS
 * language — so the compiled `.css` token artifacts would otherwise be the one
 * class of generated file nothing declared. This walks the tree by bytes, so
 * extension is irrelevant.
 *
 * Two directions, both errors:
 *
 * - a file carrying the GENERATED banner that no manifest entry covers — an
 *   artifact nothing can re-derive is an artifact that can be hand-patched
 *   while every other token rule still passes;
 * - a manifest entry that matches nothing on disk — a declaration for an
 *   artifact that no longer exists is a checker guarding a file nobody has,
 *   which is Stall 2's shape exactly.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { declaredFor, hasBanner, loadManifest } from '../eslint-rules/manifest.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'dist', 'storybook-static', 'coverage']);

function walk(dir: string, out: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

const problems: string[] = [];
const matched = new Set<string>();

for (const file of walk(REPO_ROOT, [])) {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // binary or unreadable: cannot carry a text banner
  }
  const repoRelative = relative(REPO_ROOT, file).split(sep).join('/');
  const declared = declaredFor(repoRelative);
  if (declared !== undefined) {
    matched.add(declared.pattern);
  }
  if (hasBanner(text) && declared === undefined) {
    problems.push(
      `${repoRelative}: carries the GENERATED banner but no manifest entry covers it`,
    );
  }
  if (!hasBanner(text) && declared !== undefined) {
    problems.push(
      `${repoRelative}: declared as generated but the banner is gone — regenerate with \`${declared.regenerate}\``,
    );
  }
}

for (const entry of loadManifest().artifacts) {
  if (!matched.has(entry.pattern)) {
    problems.push(
      `manifest pattern ${entry.pattern} matches nothing on disk — a checker guarding a file nobody has`,
    );
  }
}

if (problems.length > 0) {
  process.stderr.write(
    `Generated-artifact declarations are incomplete:\n${problems.map((p) => `  - ${p}`).join('\n')}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `every generated artifact is declared (${String(loadManifest().artifacts.length)} manifest entries)\n`,
);
