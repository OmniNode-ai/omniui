// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `@omninode/omniui` — the OmniNode web component library and renderer.
 *
 * The public surface is deliberately small at Phase 1A. This phase produces a
 * **workspace**, not components: plan §4 Phase 1A's success condition is "the
 * operator can sit down and author components", and D5 assigns the authoring
 * of the component types and the token values to the operator (Phase 1B).
 * What ships here is the seam those components will bind — the theme binding
 * §2.5 lists as the one thing to build new.
 */

export { ThemeProvider, useTheme, type ThemeProviderProps } from './theme/ThemeProvider.js';
export {
  THEME_DIGEST_VAR,
  THEME_ID_VAR,
  THEME_REVISION_VAR,
  THEME_SCHEMA_VERSION_VAR,
  TOKEN_VAR_PREFIX,
  sortedTokenNames,
  themeToCssProperties,
  tokenRef,
  tokenVarName,
} from './theme/css-variables.js';
export { COMPILED_THEMES } from './generated/tokens/index.js';
export {
  assertReportableTheme,
  type Theme,
  type ThemeIdentity,
  type ThemeTokenName,
  type ThemeTokenSet,
} from './theme/theme-token-set.js';
