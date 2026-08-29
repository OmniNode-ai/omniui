// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The shape a theme reaches the renderer in (OMN-16885, Phase 1A.1).
 *
 * Upstream, a theme is a `ModelThemeInstance` (omnibase_core, OMN-16882): a
 * schema-validated token VALUE set plus the three version axes the plan's §2.1
 * insists on keeping separate. Here we care about the half a browser can act
 * on — the token values, and the identity a surface has to be able to report.
 *
 * `ThemeTokenSet` is deliberately an open string map rather than a hand-copied
 * list of the schema's field names. The field list lives in exactly one place
 * (`ModelRendererThemeContract`), and a second hand-maintained copy in this
 * repo would be the two-sources-of-truth defect the whole plan exists to
 * remove. The compiled `tokens.ts` artifact (OMN-16886) narrows this to the
 * exact key union at build time, from the schema, mechanically.
 */

/** A token name exactly as the contract declares it, e.g. `color_accent_primary`. */
export type ThemeTokenName = string;

/** Token values as authored — `#0f172a`, `1rem`, `700`, a font stack. */
export type ThemeTokenSet = Readonly<Record<ThemeTokenName, string>>;

/**
 * What a surface must be able to report about the theme it is rendering.
 *
 * Plan §2.6 G-U1: a surface reports `(theme_id, instance_revision)` and the
 * **content digest** of the artifact it loaded. Version agreement alone goes
 * green on two surfaces that agree on a number while loading different bytes,
 * so the digest is not optional and is not derived here — it is carried from
 * the catalog entry that published it.
 */
export interface ThemeIdentity {
  /** Namespaced theme id, e.g. `onex.theme.dark`. */
  readonly themeId: string;
  /** The instance document's own revision, e.g. `1.0.0`. Moves on a VALUE change. */
  readonly instanceRevision: string;
  /** The contract schema version the instance was authored against. Moves on a FIELD change. */
  readonly schemaVersion: string;
  /** `sha256:<64 hex>` over the published instance, as materialised by the catalog. */
  readonly contentDigest: string;
}

/** A theme as the renderer consumes it: who it is, and what it is worth. */
export interface Theme {
  readonly identity: ThemeIdentity;
  readonly tokens: ThemeTokenSet;
}

const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/**
 * Fail closed on a theme that cannot satisfy G-U1.
 *
 * A surface that cannot report its digest is, to the uniformity gate, a
 * surface that stopped consuming the catalog — so an unreportable theme is
 * rejected at the boundary rather than rendered and quietly unaccounted for.
 *
 * @throws {TypeError} If identity fields are empty or the digest is malformed.
 */
export function assertReportableTheme(theme: Theme): void {
  const { themeId, instanceRevision, schemaVersion, contentDigest } = theme.identity;
  if (themeId.length === 0) {
    throw new TypeError('theme.identity.themeId must not be empty');
  }
  if (instanceRevision.length === 0) {
    throw new TypeError(`theme '${themeId}': instanceRevision must not be empty`);
  }
  if (schemaVersion.length === 0) {
    throw new TypeError(`theme '${themeId}': schemaVersion must not be empty`);
  }
  if (!DIGEST_PATTERN.test(contentDigest)) {
    throw new TypeError(
      `theme '${themeId}': contentDigest must be 'sha256:<64 lowercase hex>', got '${contentDigest}'`,
    );
  }
  if (Object.keys(theme.tokens).length === 0) {
    throw new TypeError(`theme '${themeId}': carries no tokens`);
  }
}
