// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `generated-artifact-parity` against real files on disk (OMN-16888).
 *
 * The rule reads the file it is linting off disk, because a banner is a
 * property of the artifact rather than of its AST. RuleTester's in-memory
 * sources therefore cannot exercise its reporting paths, so this file writes
 * scratch files at repo-relative paths and lints them.
 *
 * Every scratch path is one no real artifact occupies — a test that writes over
 * a checked-in generated file deletes it on cleanup, which is a way to lose an
 * artifact rather than to check one.
 *
 * The alternative — mocking `readFileSync` — would assert that the rule calls a
 * function, not that it catches an undeclared artifact. Those are different
 * claims and only one of them is the gate.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import tsparser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import onex from './index.js';
import { declaredFor } from './manifest.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BANNER = '// GENERATED FILE — DO NOT EDIT.\n';

const linter = new Linter();

/**
 * Lint a file at a repo-relative path, writing `contents` there first.
 *
 * @param {string} repoRelative - Path relative to the repo root.
 * @param {string} contents - File contents to write.
 * @returns {import('eslint').Linter.LintMessage[]} Messages the rule produced.
 */
function lintAt(repoRelative, contents) {
  const target = join(REPO_ROOT, repoRelative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
  try {
    return linter.verify(
      contents,
      [
        {
          files: ['**/*.ts'],
          languageOptions: { parser: tsparser },
          plugins: { onex },
          rules: { 'onex/generated-artifact-parity': 'error' },
        },
      ],
      target,
    );
  } finally {
    rmSync(target, { force: true });
  }
}

describe('generated-artifact-parity', () => {
  it('rejects a generated artifact no parity checker covers', () => {
    const messages = lintAt(
      'src/generated/undeclared-artifact.ts',
      `${BANNER}export const x = 1;\n`,
    );
    expect(messages.map((m) => m.messageId)).toStrictEqual(['undeclared']);
    expect(messages[0]?.message).toContain('generated-artifacts.json');
  });

  it('rejects a declared artifact that lost its banner', () => {
    // `src/generated/tokens/*.ts` is declared in the manifest. Without the
    // banner it reads as hand-maintained, which is how a generated file quietly
    // stops being regenerated. The path is one the pattern matches but that does
    // not exist in the repo — a test must never write over a real artifact.
    const messages = lintAt('src/generated/tokens/scratch.parity.ts', 'export const x = 1;\n');
    expect(messages.map((m) => m.messageId)).toStrictEqual(['bannerless']);
    expect(messages[0]?.message).toContain('npm run compile:tokens');
  });

  it('accepts a declared artifact carrying its banner', () => {
    const messages = lintAt(
      'src/generated/tokens/scratch.parity.ts',
      `${BANNER}export const x = 1;\n`,
    );
    expect(messages).toStrictEqual([]);
  });

  it('accepts an ordinary source file that is neither', () => {
    const messages = lintAt('src/scratch-parity-ordinary.ts', 'export const x = 1;\n');
    expect(messages).toStrictEqual([]);
  });

  it('does not mistake a file that merely mentions the banner for an artifact', () => {
    // A test asserting on the banner string is not an artifact carrying one.
    // Without this, the rule reports its own regression tests.
    const messages = lintAt(
      'src/scratch-parity-mentions.ts',
      [
        ...Array.from({ length: 14 }, (_, i) => `// header line ${String(i)}`),
        'export const assertion =',
        "  'GENERATED FILE — DO NOT EDIT.';",
      ].join('\n'),
    );
    expect(messages).toStrictEqual([]);
  });

  it('declares every real generated artifact, including the ones ESLint cannot lint', () => {
    // Checked against the manifest directly rather than through ESLint, because
    // ESLint 9 has no CSS language and would silently skip the .css artifacts —
    // which are exactly the ones most likely to go undeclared.
    const paths = [
      'src/generated/onex-models.ts',
      'src/generated/tokens/onex.theme.dark.css',
      'src/generated/tokens/onex.theme.light.ts',
      'src/generated/tokens/tailwind/onex.theme.warm.css',
      'src/generated/tokens/index.json',
      'src/generated/tokens/index.ts',
    ];
    const undeclared = paths.filter((path) => declaredFor(path) === undefined);
    expect(undeclared).toStrictEqual([]);
  });

  it('declares nothing that is not generated', () => {
    for (const path of ['src/index.ts', 'src/theme/ThemeProvider.tsx', 'README.md']) {
      expect(declaredFor(path)).toBeUndefined();
    }
  });
});
