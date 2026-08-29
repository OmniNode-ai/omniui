// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Hand-built themes for tests and stories only (OMN-16885, Phase 1A.1).
 *
 * These are NOT the theme catalog. The catalog is `ModelThemeInstance`
 * documents in `omnibase_core/contracts/themes/` (OMN-16882) compiled by the
 * OMN-16886 pipeline; this file exists so the workspace has something to
 * render before that pipeline lands, and so a test can assert on a theme whose
 * values it fully controls.
 *
 * Deliberately not exported from `src/index.ts`: a consumer that could import
 * a fixture theme could ship one, and a shipped fixture is a token value with
 * no catalog entry behind it.
 */

import type { Theme } from './theme-token-set.js';

/** A digest-shaped placeholder. Not a real catalog digest and never published. */
const FIXTURE_DIGEST_SLATE =
  'sha256:0000000000000000000000000000000000000000000000000000000000000001';
const FIXTURE_DIGEST_PAPER =
  'sha256:0000000000000000000000000000000000000000000000000000000000000002';

/** Dark-surface fixture theme. */
export const FIXTURE_THEME_SLATE: Theme = {
  identity: {
    themeId: 'fixture.theme.slate',
    instanceRevision: '1.0.0',
    schemaVersion: '1.0.0',
    contentDigest: FIXTURE_DIGEST_SLATE,
  },
  tokens: {
    color_background_primary: '#0f172a',
    color_background_secondary: '#1e293b',
    color_text_primary: '#f8fafc',
    color_text_secondary: '#94a3b8',
    color_accent_primary: '#6366f1',
    color_border_default: '#334155',
    spacing_sm: '0.5rem',
    spacing_md: '1rem',
    font_family_base: "'Inter', system-ui, sans-serif",
    font_size_md: '1rem',
    border_radius_md: '0.5rem',
  },
};

/** Light-surface fixture theme, same token names, different values. */
export const FIXTURE_THEME_PAPER: Theme = {
  identity: {
    themeId: 'fixture.theme.paper',
    instanceRevision: '1.0.0',
    schemaVersion: '1.0.0',
    contentDigest: FIXTURE_DIGEST_PAPER,
  },
  tokens: {
    color_background_primary: '#ffffff',
    color_background_secondary: '#f1f5f9',
    color_text_primary: '#0f172a',
    color_text_secondary: '#475569',
    color_accent_primary: '#4338ca',
    color_border_default: '#cbd5e1',
    spacing_sm: '0.5rem',
    spacing_md: '1rem',
    font_family_base: "'Inter', system-ui, sans-serif",
    font_size_md: '1rem',
    border_radius_md: '0.5rem',
  },
};
