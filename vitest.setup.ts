// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

import '@testing-library/jest-dom/vitest';

/**
 * Strip host-injected configuration before any test runs.
 *
 * `test.env: {}` does not remove inherited variables — it only adds. A suite
 * whose result depends on an untracked file or a shell export cannot prove that
 * a mutation turned CI red, which is the whole basis of gates G1A.2 and G1A.3.
 * `hermetic-env.test.ts` is the regression: run
 * `VITE_SENTINEL=leak ONEX_SENTINEL=leak npm test` and it must still pass.
 */
const HOST_PREFIXES = ['VITE_', 'STORYBOOK_', 'ONEX_', 'OMNI'];
for (const key of Object.keys(process.env)) {
  if (HOST_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    Reflect.deleteProperty(process.env, key);
  }
}
