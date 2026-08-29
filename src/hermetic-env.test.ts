// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The suite must not be able to read host configuration (OMN-16885).
 *
 * Regression for the defect that produced plan gate G0.1: omnidash's suite read
 * machine-local `.env` files through `import.meta.env`, so it was green in CI
 * and red on the workstation. A suite whose greenness depends on an untracked
 * file cannot prove that a mutation turned CI red — which is what G1A.3 and
 * every §2.3 lint rule are ultimately measured by.
 *
 * Falsify this by running: `VITE_SENTINEL=leak ONEX_SENTINEL=leak npm test`.
 * If either sentinel is visible below, isolation is decorative.
 */

import { describe, expect, it } from 'vitest';

const HOST_PREFIXES = ['VITE_', 'STORYBOOK_', 'ONEX_', 'OMNI'];

describe('test environment isolation', () => {
  it('exposes no host-injected process.env variable', () => {
    const leaked = Object.keys(process.env).filter((key) =>
      HOST_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );
    expect(leaked).toStrictEqual([]);
  });

  it('exposes no host-injected value through import.meta.env', () => {
    // Vitest mirrors the whole of process.env onto import.meta.env in the
    // worker — it is not the narrow, prefix-filtered surface a Vite *build*
    // produces. So the dotfile guard (`envPrefix` in vitest.config.ts) closes
    // one door and the setup-file strip closes the other, and this asserts on
    // both from the side a component would actually read.
    const leaked = Object.keys(import.meta.env).filter((key) =>
      HOST_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );
    expect(leaked).toStrictEqual([]);
  });
});
