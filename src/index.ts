// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `@omninode/omniui` — the OmniNode web component library and renderer.
 *
 * Phase 1A shipped the workspace and the theme binding. Phase 1B adds the
 * seam the component types bind through: envelope acceptance, seal
 * verification, binding resolution, and the declared empty state a component
 * renders when a read did not resolve.
 *
 * The one rule the surface encodes: a **host** performs reads and hands the
 * results in; a **component** renders what it was handed. That is plan §2.2's
 * binding rule and gate G1B.1, and it is why `HostDatasets` is a parameter
 * rather than something a component could go and get.
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

// The widget-envelope binding seam (OMN-16935, Phase 1B.1). A host accepts an
// envelope, resolves its declared bindings, and hands the results to a
// component; a component performs no read of its own (gate G1B.1).
export {
  acceptEnvelope,
  acceptEnvelopeNode,
  canonicalJson,
  computeEnvelopeDigest,
  isRawNumber,
  narrowJsonSource,
  orderRows,
  parseJsonSource,
  requireBinding,
  resolveBinding,
  sha256Hex,
  sha256HexBytes,
  type BindingResolution,
  type BoundDataset,
  type HostDatasets,
  type JsonSourceValue,
  type ProjectionRow,
  type RawNumber,
  type ResolvedBinding,
  type UnresolvedBinding,
} from './binding/index.js';
export { EmptyState, type EmptyStateProps } from './components/EmptyState.js';
export { Icon, hasIcon, type IconProps } from './components/Icon.js';
export { MetricCluster, type MetricClusterProps } from './components/MetricCluster.js';
export { StatusGrid, type StatusGridProps } from './components/StatusGrid.js';
export { TrendChart, type TrendChartProps } from './components/TrendChart.js';
