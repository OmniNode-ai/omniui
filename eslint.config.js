// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Flat ESLint config for omniui (OMN-16885, Phase 1A.1).
 *
 * Lint is wired into CI from the first real commit — Operating Rule #5: a
 * check that is not a merge gate is advisory and gets ignored. The five scoped
 * semantic-token rules from plan §2.3 land on top of this base in OMN-16888;
 * this file is the surface they plug into, and it carries no warn-only rules
 * (`feedback_gates_block_no_bypass`).
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'node_modules/**',
      'coverage/**',
      // Generated artifacts are governed by `generated-artifact-parity` (plan
      // §2.3) — they must equal a fresh compile of their declared source — not
      // by hand-style rules. Linting them would only ever produce pressure to
      // hand-edit an artifact that must never be hand-edited.
      'src/generated/onex-models.ts',
      'src/generated/tokens/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Tests and stories may assert on shapes the strict type rules would
    // otherwise force them to launder. The exemption is scoped to these two
    // globs and declared here, not left to a reviewer's judgement (G1A.4).
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    // This config file is itself JavaScript and is not part of the TypeScript
    // program, so the type-aware rules have nothing to resolve against.
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['*.config.ts', '.storybook/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
