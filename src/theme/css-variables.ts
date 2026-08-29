// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Token name → CSS custom property, and the reverse (OMN-16885, Phase 1A.1).
 *
 * One prefix, one transform, no per-token table. A table would be a third
 * place a token name can be spelled, and every one of those is somewhere a
 * rename can half-land.
 */

import type { Theme, ThemeTokenName, ThemeTokenSet } from './theme-token-set.js';

/** Every custom property this library emits carries this prefix. */
export const TOKEN_VAR_PREFIX = '--onex-';

/** The identity properties G-U1 reads off a rendered surface. */
export const THEME_ID_VAR = '--onex-theme-id';
export const THEME_REVISION_VAR = '--onex-theme-revision';
export const THEME_SCHEMA_VERSION_VAR = '--onex-theme-schema-version';
export const THEME_DIGEST_VAR = '--onex-theme-digest';

/**
 * Return the CSS custom-property name for a contract token name.
 *
 * @param token - Contract token name, e.g. `color_accent_primary`.
 * @returns The custom property, e.g. `--onex-color-accent-primary`.
 */
export function tokenVarName(token: ThemeTokenName): string {
  return `${TOKEN_VAR_PREFIX}${token.replaceAll('_', '-')}`;
}

/**
 * Return a `var()` reference to a token, for use as a style value.
 *
 * This is the only sanctioned way component code names a colour or a length:
 * the value resolves at paint time from whichever theme the host activated, so
 * no component can pin a value the theme cannot move.
 *
 * @param token - Contract token name, e.g. `spacing_md`.
 * @returns `var(--onex-spacing-md)`.
 */
export function tokenRef(token: ThemeTokenName): string {
  return `var(${tokenVarName(token)})`;
}

/**
 * Materialise a theme as a CSS declaration map.
 *
 * Keys are emitted in sorted order so the same theme always produces the same
 * declaration sequence — the determinism G1A.2 demands, applied here rather
 * than only in the compiler, because a renderer that reorders is just as
 * capable of producing two different digests for one entry.
 *
 * @param theme - The theme to materialise.
 * @returns Custom-property declarations, including the four identity vars.
 */
export function themeToCssProperties(theme: Theme): Record<string, string> {
  const out: Record<string, string> = {
    [THEME_ID_VAR]: theme.identity.themeId,
    [THEME_REVISION_VAR]: theme.identity.instanceRevision,
    [THEME_SCHEMA_VERSION_VAR]: theme.identity.schemaVersion,
    [THEME_DIGEST_VAR]: theme.identity.contentDigest,
  };
  for (const [token, value] of Object.entries(theme.tokens).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    out[tokenVarName(token)] = value;
  }
  return out;
}

/**
 * Token names in a stable order.
 *
 * @param tokens - The token set to order.
 * @returns The token names, sorted by code unit.
 */
export function sortedTokenNames(tokens: ThemeTokenSet): ThemeTokenName[] {
  return Object.keys(tokens).sort();
}
