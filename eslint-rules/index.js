// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The `onex` ESLint plugin — five scoped semantic-token rules (OMN-16888).
 *
 * Plan §2.3. Every rule declares **what it inspects, what counts as a
 * violation, and what is out of scope**, in its own header and in the config
 * below — never in a reviewer's head (G1A.4).
 *
 * Non-negotiables, each from the plan:
 *
 * - **Wired as CI from commit one.** `lint` runs inside the required `build`
 *   job, so a violation blocks the merge (Operating Rule #5).
 * - **No warn-only mode.** Every rule is `error` (`feedback_gates_block_no_bypass`).
 * - **The allowlist only shrinks.** The single exemption form is
 *   `// onex-token-exempt: <reason>` and it requires a reason, because an
 *   allowlist entry nobody can read is one nobody can remove.
 */

import generatedArtifactParity from './generated-artifact-parity.js';
import noColorInline from './no-color-inline.js';
import noSpacingInline from './no-spacing-inline.js';
import noUnsourcedCss from './no-unsourced-css.js';
import svgAndChartInputs from './svg-and-chart-inputs.js';

const plugin = {
  meta: { name: 'onex', version: '1.0.0' },
  rules: {
    'no-color-inline': noColorInline,
    'no-spacing-inline': noSpacingInline,
    'no-unsourced-css': noUnsourcedCss,
    'svg-and-chart-inputs': svgAndChartInputs,
    'generated-artifact-parity': generatedArtifactParity,
  },
};

export default plugin;
