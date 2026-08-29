// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The token compiler (OMN-16886, Phase 1A.2).
 *
 * Theme instance -> `tokens.css` + `tokens.ts` + a Tailwind v4 `@theme`
 * artifact, deterministically and digested.
 *
 * **This migrates OMN-2951's mechanism rather than re-authoring it.** The
 * shape is lifted from `omniweb/scripts/compile-tokens.ts`: parse a declared
 * source, validate it, emit CSS + TypeScript + a framework preset, and digest
 * the canonical JSON of the *input*. Three things change, each for a recorded
 * reason:
 *
 * 1. **The source is a `ModelThemeInstance`, not a bespoke `tokens.yaml`.**
 *    OMN-2951's contract was a hand-rolled Zod schema with no upstream owner.
 *    Phase C1 gave token values a home validated by
 *    `ModelRendererThemeContract`, so the compiler reads that and nothing else.
 * 2. **The digest covers the OUTPUT as well as the input.** OMN-2951 wrote a
 *    `checksum.txt` over `tokens.yaml` and compared it to itself — it guarded a
 *    file nothing used, for four months, while four token values drifted. A
 *    digest that only ever agrees with itself is not a gate.
 * 3. **Nothing here reads a clock, a path, or the environment.** R-22's live
 *    counter-example (`generatedAt: new Date().toISOString()` in omnidash's
 *    generated registry) is exactly the class G1A.2 forbids.
 *
 * The compiler is a pure function from a catalog to a file map. It performs no
 * I/O of its own; `scripts/compile-tokens.ts` writes what it returns and
 * `src/tokens/compile.test.ts` compares two runs of it. A compiler that writes
 * as it computes cannot be run twice and compared.
 */

import type { ModelThemeCatalog, ModelThemeInstance } from '../generated/onex-models.js';
import { tokenVarName } from '../theme/css-variables.js';

/** Token-set fields that are the set's own header, not design tokens. */
const HEADER_FIELDS = new Set(['theme_id', 'contract_version']);

/** One compiled artifact: its repo-relative path and its exact bytes. */
export interface CompiledArtifact {
  readonly path: string;
  readonly contents: string;
}

/** Everything one compile run produces. */
export interface CompileResult {
  readonly artifacts: readonly CompiledArtifact[];
}

/** The source a compile run reads. */
export interface ThemeCatalogCapture {
  readonly catalog: ModelThemeCatalog;
  readonly instances: Readonly<Record<string, ModelThemeInstance>>;
}

/**
 * Render a `ModelSemVer` as `major.minor.patch`.
 *
 * @param version - The semver to render.
 * @returns The dotted string.
 */
export function semver(version: {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}): string {
  return `${String(version.major)}.${String(version.minor)}.${String(version.patch)}`;
}

/**
 * Extract a theme's design tokens, minus the token set's own header.
 *
 * @param instance - The theme instance to read.
 * @returns Token name → value, sorted by token name.
 * @throws {TypeError} If a non-header token is not a string.
 */
export function designTokens(instance: ModelThemeInstance): [string, string][] {
  const out: [string, string][] = [];
  for (const [name, value] of Object.entries(instance.tokens)) {
    if (HEADER_FIELDS.has(name)) {
      continue;
    }
    if (typeof value !== 'string') {
      throw new TypeError(
        `theme '${instance.theme_id}': token '${name}' is ${typeof value}, expected string`,
      );
    }
    out.push([name, value]);
  }
  out.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return out;
}

/**
 * RFC-8785-shaped canonical JSON: object keys sorted, no insignificant space.
 *
 * Lifted from OMN-2951's `canonicalJson`. It is what makes the digest a
 * statement about content rather than about whichever writer serialised it.
 *
 * @param value - Any JSON-representable value.
 * @returns Its canonical serialisation.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const body = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(',');
  return `{${body}}`;
}

const BANNER = `/* GENERATED FILE — DO NOT EDIT.
 *
 * Compiled from a ModelThemeInstance by \`npm run compile:tokens\` (OMN-16886).
 * Hand-editing a value here does not change what any surface renders — it only
 * makes this artifact disagree with the theme instance it claims to compile,
 * which \`npm run check:tokens\` turns into a failing build.
 *
 * To change a token VALUE, publish a new instance revision upstream and
 * recapture. Editing a value is never a code change.
 */`;

const TS_BANNER = `// GENERATED FILE — DO NOT EDIT.
//
// Compiled from a ModelThemeInstance by \`npm run compile:tokens\` (OMN-16886).
// Hand-editing a value here does not change what any surface renders — it only
// makes this artifact disagree with the theme instance it claims to compile,
// which \`npm run check:tokens\` turns into a failing build.
//
// To change a token VALUE, publish a new instance revision upstream and
// recapture. Editing a value is never a code change.`;

/**
 * Compile one theme instance to its CSS custom-property artifact.
 *
 * The block is scoped to `[data-onex-theme="<id>"]` rather than `:root` so
 * every published theme can be loaded at once and the active one selected by
 * the attribute `ThemeProvider` already stamps. A `:root` block per theme would
 * make the last stylesheet loaded win, which is a load-order dependency
 * masquerading as a theme choice.
 *
 * @param instance - The theme instance to compile.
 * @param contentDigest - The catalog entry's digest for this instance.
 * @returns The CSS artifact's contents.
 */
export function compileCss(instance: ModelThemeInstance, contentDigest: string): string {
  const lines: string[] = [BANNER, '', `[data-onex-theme='${instance.theme_id}'] {`];
  lines.push(`  --onex-theme-id: ${instance.theme_id};`);
  lines.push(`  --onex-theme-revision: ${semver(instance.instance_revision)};`);
  lines.push(`  --onex-theme-schema-version: ${semver(instance.schema_version)};`);
  lines.push(`  --onex-theme-digest: ${contentDigest};`);
  for (const [name, value] of designTokens(instance)) {
    lines.push(`  ${tokenVarName(name)}: ${value};`);
  }
  lines.push('}', '');
  return lines.join('\n');
}

/**
 * Compile one theme instance to its typed TypeScript artifact.
 *
 * @param instance - The theme instance to compile.
 * @param contentDigest - The catalog entry's digest for this instance.
 * @returns The TypeScript artifact's contents.
 */
export function compileTs(instance: ModelThemeInstance, contentDigest: string): string {
  const tokens = designTokens(instance);
  const identifier = themeIdentifier(instance.theme_id);
  const lines: string[] = [
    '// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.',
    '// SPDX-License-Identifier: MIT',
    TS_BANNER,
    '',
    "import type { Theme } from '../../theme/theme-token-set.js';",
    '',
    `export const ${identifier} = {`,
    '  identity: {',
    `    themeId: '${instance.theme_id}',`,
    `    instanceRevision: '${semver(instance.instance_revision)}',`,
    `    schemaVersion: '${semver(instance.schema_version)}',`,
    `    contentDigest: '${contentDigest}',`,
    '  },',
    '  tokens: {',
  ];
  for (const [name, value] of tokens) {
    lines.push(`    ${name}: ${JSON.stringify(value)},`);
  }
  lines.push('  },', '} as const satisfies Theme;', '');
  return lines.join('\n');
}

/**
 * Compile the barrel that makes the published themes importable by name.
 *
 * This is what a consumer of the package actually reaches for: the compiled
 * themes, typed, with their catalog-issued digests attached. Generating it
 * rather than hand-maintaining it means adding a theme upstream adds an export
 * here with no edit — the two-file widget-add problem, not repeated for themes.
 *
 * @param themeIds - Theme ids in the order the catalog declares them.
 * @returns The barrel module's contents.
 */
export function compileBarrel(themeIds: readonly string[]): string {
  const lines: string[] = [
    '// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.',
    '// SPDX-License-Identifier: MIT',
    TS_BANNER,
    '',
    "import type { Theme } from '../../theme/theme-token-set.js';",
    '',
  ];
  for (const themeId of themeIds) {
    lines.push(`export { ${themeIdentifier(themeId)} } from './${themeId}.js';`);
  }
  lines.push('');
  for (const themeId of themeIds) {
    lines.push(`import { ${themeIdentifier(themeId)} } from './${themeId}.js';`);
  }
  lines.push('');
  lines.push('/** Every published theme, keyed by `theme_id`. */');
  lines.push('export const COMPILED_THEMES: Readonly<Record<string, Theme>> = {');
  for (const themeId of themeIds) {
    lines.push(`  '${themeId}': ${themeIdentifier(themeId)},`);
  }
  lines.push('};', '');
  return lines.join('\n');
}

/**
 * Compile one theme instance to a Tailwind v4 `@theme` artifact.
 *
 * **omniweb only** (D7). Tailwind and shadcn are dropped in omnidash, where
 * they were vestigial — two full token vocabularies against roughly fourteen
 * real utility usages. omniweb uses Tailwind meaningfully, so the app sheds the
 * framework and the pipeline keeps one emitter.
 *
 * Under D3 rule 1 **no token value may originate here.** This is a compile
 * product exactly like the CSS, subject to the same drift gate; a value that
 * appears in this file and nowhere upstream is a defect, not a customisation.
 *
 * @param instance - The theme instance to compile.
 * @param contentDigest - The catalog entry's digest for this instance.
 * @returns The Tailwind `@theme` artifact's contents.
 */
export function compileTailwindTheme(
  instance: ModelThemeInstance,
  contentDigest: string,
): string {
  const lines: string[] = [
    BANNER,
    '',
    `/* Tailwind v4 @theme preset for ${instance.theme_id}`,
    ` * revision ${semver(instance.instance_revision)} · schema ${semver(instance.schema_version)}`,
    ` * ${contentDigest}`,
    ' *',
    ' * omniweb only (D7). omnidash does not consume Tailwind.',
    ' */',
    '@theme {',
  ];
  for (const [name, value] of designTokens(instance)) {
    lines.push(`  ${tailwindVarName(name)}: ${value};`);
  }
  lines.push('}', '');
  return lines.join('\n');
}

/**
 * Map a contract token name onto Tailwind v4's namespaced `@theme` variables.
 *
 * Tailwind derives utility classes from the variable namespace, so
 * `color_status_error` must land as `--color-status-error` for `text-status-error`
 * to exist. Names outside a namespace Tailwind knows are emitted under
 * `--onex-*`, where they are still readable as `var()` but generate no utility —
 * a deliberate choice over inventing a namespace Tailwind would ignore anyway.
 *
 * @param token - Contract token name.
 * @returns The Tailwind `@theme` variable name.
 */
export function tailwindVarName(token: string): string {
  const kebab = token.replaceAll('_', '-');
  for (const [prefix, namespace] of [
    ['color-', 'color'],
    ['spacing-', 'spacing'],
    ['font-size-', 'text'],
    ['font-family-', 'font'],
    ['font-weight-', 'font-weight'],
    ['border-radius-', 'radius'],
  ] as const) {
    if (kebab.startsWith(prefix)) {
      return `--${namespace}-${kebab.slice(prefix.length)}`;
    }
  }
  return `--onex-${kebab}`;
}

/**
 * Turn `onex.theme.dark` into a TypeScript identifier.
 *
 * @param themeId - The namespaced theme id.
 * @returns A `SCREAMING_SNAKE_CASE` identifier.
 */
export function themeIdentifier(themeId: string): string {
  return `THEME_${themeId.replaceAll(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
}

/**
 * Compile a whole catalog into the full artifact set.
 *
 * Pure: same input, same output, no clock, no path, no environment. That is
 * what makes G1A.2 checkable by calling this twice and comparing.
 *
 * @param capture - The captured catalog and its instance documents.
 * @returns Every artifact, ordered by path.
 * @throws {Error} If an entry has no instance, or an instance disagrees with its entry.
 */
export function compileCatalog(capture: ThemeCatalogCapture): CompileResult {
  const artifacts: CompiledArtifact[] = [];
  const index: { theme_id: string; revision: string; digest: string; artifacts: string[] }[] = [];

  const entries = [...capture.catalog.entries].sort((a, b) =>
    a.theme_id < b.theme_id ? -1 : a.theme_id > b.theme_id ? 1 : 0,
  );

  for (const entry of entries) {
    const instance = capture.instances[entry.theme_id];
    if (instance === undefined) {
      throw new Error(`catalog entry '${entry.theme_id}' has no instance document`);
    }
    // The header exists so the version axes are legible without parsing the
    // token set. A header that can drift from its body is worse than none.
    if (semver(instance.instance_revision) !== semver(entry.instance_revision)) {
      throw new Error(
        `theme '${entry.theme_id}': instance revision ${semver(instance.instance_revision)} ` +
          `disagrees with catalog entry ${semver(entry.instance_revision)}`,
      );
    }

    const paths = {
      css: `src/generated/tokens/${entry.theme_id}.css`,
      ts: `src/generated/tokens/${entry.theme_id}.ts`,
      tailwind: `src/generated/tokens/tailwind/${entry.theme_id}.css`,
    };
    artifacts.push({ path: paths.css, contents: compileCss(instance, entry.content_digest) });
    artifacts.push({ path: paths.ts, contents: compileTs(instance, entry.content_digest) });
    artifacts.push({
      path: paths.tailwind,
      contents: compileTailwindTheme(instance, entry.content_digest),
    });

    index.push({
      theme_id: entry.theme_id,
      revision: semver(entry.instance_revision),
      digest: entry.content_digest,
      artifacts: [paths.css, paths.ts, paths.tailwind],
    });
  }

  artifacts.push({
    path: 'src/generated/tokens/index.ts',
    contents: compileBarrel(index.map((entry) => entry.theme_id)),
  });
  artifacts.push({
    path: 'src/generated/tokens/index.json',
    contents: `${JSON.stringify({ catalog_version: semver(capture.catalog.catalog_version), themes: index }, null, 2)}\n`,
  });

  artifacts.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { artifacts };
}
