// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Captured contract and projection fixtures (OMN-16889, Phase 1A.5).
 *
 * Every fixture here is **captured from a declared exposure**, never scraped
 * from a live endpoint. The distinction is the ticket's whole point: a live
 * capture records whatever an endpoint happened to be serving, so a later
 * divergence between fixture and reality falsifies nothing. A capture from a
 * declared exposure records what the contract says it will serve, so a
 * divergence is a finding.
 *
 * These fixtures are the substrate Phase 1B is measured on. They exist before
 * the components that render them on purpose — capturing them inside 1B would
 * let the fixture be shaped to fit the component.
 *
 * The theme capture moved to `themes/` at the repo root in OMN-16886: it is a
 * **build input** to the token compiler, not a test fixture, and leaving it
 * under `src/fixtures/` would have implied a compiled artifact was derived from
 * something a test could edit.
 */

import type { ModelThemeCatalog, ModelThemeInstance } from '../generated/onex-models.js';
import type { Theme } from '../theme/theme-token-set.js';

import consumerFlowExposure from './projections/consumer-flow.v1.exposure.json' with { type: 'json' };
import consumerFlowResponse from './projections/consumer-flow.v1.response.json' with { type: 'json' };
import themeCatalogCapture from '../../themes/theme-catalog.capture.json' with { type: 'json' };

/** The packaged theme catalog, exactly as `omnibase_core` publishes it. */
export const THEME_CATALOG = themeCatalogCapture.catalog as unknown as ModelThemeCatalog;

/** Every packaged theme instance, keyed by `theme_id`. */
export const THEME_INSTANCES = themeCatalogCapture.instances as unknown as Readonly<
  Record<string, ModelThemeInstance>
>;

/** The declared `projection_api` block for `onex.snapshot.projection.consumer-flow.v1`. */
export const CONSUMER_FLOW_EXPOSURE = consumerFlowExposure;

/** One projection-API response envelope covering every declared `flow_state`. */
export const CONSUMER_FLOW_RESPONSE = consumerFlowResponse;

/** Render a `ModelSemVer` the way the catalog's own filenames do. */
function semver(version: {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}): string {
  return `${String(version.major)}.${String(version.minor)}.${String(version.patch)}`;
}

/**
 * Adapt a captured theme instance into the shape `ThemeProvider` consumes.
 *
 * The digest is read from the **catalog entry**, not recomputed here. A
 * consumer that recomputes its own digest can only ever agree with itself,
 * which is exactly the self-referential check that let OMN-2951's token
 * pipeline guard a file nothing used for four months.
 *
 * @param themeId - A `theme_id` present in the captured catalog.
 * @returns The theme, ready to pass to `ThemeProvider`.
 * @throws {Error} If the id is absent from the catalog or the instances.
 */
export function fixtureTheme(themeId: string): Theme {
  const instance = THEME_INSTANCES[themeId];
  if (instance === undefined) {
    throw new Error(`no captured theme instance for '${themeId}'`);
  }
  const entry = THEME_CATALOG.entries.find((candidate) => candidate.theme_id === themeId);
  if (entry === undefined) {
    throw new Error(`theme '${themeId}' has an instance but no catalog entry`);
  }

  const tokens: Record<string, string> = {};
  for (const [name, value] of Object.entries(instance.tokens)) {
    // `theme_id` and `contract_version` are the token set's own header, not
    // design tokens. Publishing them as custom properties would collide with
    // the identity vars the provider stamps.
    if (name === 'theme_id' || name === 'contract_version') {
      continue;
    }
    if (typeof value !== 'string') {
      throw new TypeError(`theme '${themeId}': token '${name}' is not a string`);
    }
    tokens[name] = value;
  }

  return {
    identity: {
      themeId,
      instanceRevision: semver(entry.instance_revision),
      schemaVersion: semver(entry.schema_version),
      contentDigest: entry.content_digest,
    },
    tokens,
  };
}

/** Every `theme_id` in the captured catalog. */
export function fixtureThemeIds(): string[] {
  return THEME_CATALOG.entries.map((entry) => entry.theme_id).sort();
}
