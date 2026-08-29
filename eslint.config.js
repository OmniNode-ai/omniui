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

import onex from './eslint-rules/index.js';

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
      // Generated artifacts are governed by `onex/generated-artifact-parity`
      // and by the byte-comparing parity checkers it declares, not by hand-style
      // rules whose only remedy would be to edit an artifact that must never be
      // hand-edited. They are re-included below for the parity rule alone.
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
    // The five scoped semantic-token rules (plan §2.3, OMN-16888). Errors, never
    // warnings: a warn-only gate is a gate nobody has to pass.
    files: ['src/**/*.ts', 'src/**/*.tsx', '.storybook/**/*.ts'],
    plugins: { onex },
    rules: {
      'onex/no-color-inline': 'error',
      'onex/no-spacing-inline': 'error',
      'onex/no-unsourced-css': 'error',
      'onex/svg-and-chart-inputs': 'error',
    },
  },
  {
    // `generated-artifact-parity` is the one rule that must see the generated
    // files themselves — it is what proves each of them is re-derivable. It runs
    // with type checking disabled because a generated artifact's style is not
    // this repo's business; only its provenance is.
    files: ['src/generated/**/*.ts', 'src/generated/**/*.css'],
    ignores: [],
    plugins: { onex },
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'onex/generated-artifact-parity': 'error',
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
