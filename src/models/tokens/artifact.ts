// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The framework-free token artifact (OMN-21848).
 *
 * One pure function from the captured theme catalog plus the status palette to
 * three files: a CSS custom-properties file (light by default, dark under a
 * selector and a `prefers-color-scheme` query), a typed JSON file of the same
 * tokens, and a manifest holding the sha256 of each of the two.
 *
 * Nothing here reads a clock, a path or the environment, and nothing imports a
 * UI library: a plain page, a terminal renderer or a native app can read the
 * output, and a consumer pins the digests in the manifest.
 */

import { createHash } from 'node:crypto';

import { tokenVarName } from '../../theme/css-variables.js';
import { designTokens, semver, type CompiledArtifact, type ThemeCatalogCapture } from '../../tokens/compile.js';
import { STATUS_NAMES, type StatusPalette } from './status-palette.js';

export const ARTIFACT_DIR = 'src/generated/tokens/artifact';
export const ARTIFACT_CSS_PATH = `${ARTIFACT_DIR}/onex-tokens.css`;
export const ARTIFACT_JSON_PATH = `${ARTIFACT_DIR}/onex-tokens.json`;
export const ARTIFACT_MANIFEST_PATH = `${ARTIFACT_DIR}/manifest.json`;

/** Attribute that selects a colour scheme explicitly on the root element. */
export const SCHEME_ATTRIBUTE = 'data-onex-color-scheme';

const GENERATED = 'GENERATED FILE — DO NOT EDIT.';
const REGENERATE = '`npm run compile:tokens` (OMN-21848)';

type Scheme = 'light' | 'dark';

/** The typed shape of `onex-tokens.json`. */
export interface TokenArtifactJson {
  readonly _generated: string;
  readonly schema: 'onex.design-tokens/1';
  readonly source: {
    readonly catalog_version: string;
    readonly palette_version: string;
    readonly themes: Readonly<Record<Scheme, { readonly theme_id: string; readonly revision: string; readonly digest: string }>>;
  };
  readonly tokens: Readonly<Record<Scheme, Readonly<Record<string, string>>>>;
  readonly status: Readonly<
    Record<string, { readonly light: string; readonly dark: string; readonly icon: string; readonly icon_id: string }>
  >;
}

/** The typed shape of `manifest.json`. */
export interface TokenArtifactManifest {
  readonly _generated: string;
  readonly algorithm: 'sha256';
  readonly files: readonly { readonly path: string; readonly sha256: string }[];
}

function sha256(contents: string): string {
  return createHash('sha256').update(contents, 'utf8').digest('hex');
}

function statusVar(name: string, part: 'color' | 'icon'): string {
  return `--onex-status-${name}-${part}`;
}

function schemeTokens(
  capture: ThemeCatalogCapture,
  palette: StatusPalette,
  scheme: Scheme,
): { entry: { theme_id: string; revision: string; digest: string }; tokens: [string, string][] } {
  const themeId = palette.themes[scheme];
  const instance = capture.instances[themeId];
  const entry = capture.catalog.entries.find((candidate) => candidate.theme_id === themeId);
  if (instance === undefined || entry === undefined) {
    throw new Error(`palette theme '${themeId}' is not in the captured catalog`);
  }
  return {
    entry: { theme_id: themeId, revision: semver(entry.instance_revision), digest: entry.content_digest },
    tokens: designTokens(instance),
  };
}

function cssHeader(): string {
  return [
    '/* ' + GENERATED,
    ' *',
    ` * Framework-free design tokens, compiled by ${REGENERATE}.`,
    ' * Hand-editing a value here makes this file disagree with its source, which',
    ' * `npm run check:tokens` turns into a failing build.',
    ' *',
    ' * Colour scheme:',
    ' *   - light is the default, on :root.',
    ` *   - dark applies under :root[${SCHEME_ATTRIBUTE}='dark'] (explicit choice).`,
    ' *   - dark also applies under @media (prefers-color-scheme: dark), unless the',
    ` *     root carries ${SCHEME_ATTRIBUTE}='light'.`,
    ' * Every status colour has an icon token beside it; colour is never the only signal.',
    ' */',
  ].join('\n');
}

function declarations(lines: readonly string[], indent: string): string[] {
  return lines.map((line) => `${indent}${line}`);
}

/**
 * Compile the framework-free artifact set.
 *
 * @param capture - The captured theme catalog and its instances.
 * @param palette - The validated status palette.
 * @returns The css, json and manifest files, ordered by path.
 * @throws {Error} If the two schemes do not carry the same token names.
 */
export function compileTokenArtifact(
  capture: ThemeCatalogCapture,
  palette: StatusPalette,
): readonly CompiledArtifact[] {
  const light = schemeTokens(capture, palette, 'light');
  const dark = schemeTokens(capture, palette, 'dark');
  const lightNames = light.tokens.map(([name]) => name).join(',');
  const darkNames = dark.tokens.map(([name]) => name).join(',');
  if (lightNames !== darkNames) {
    throw new Error('light and dark themes carry different token names');
  }

  const colourVars = (scheme: Scheme, tokens: [string, string][]): string[] => [
    ...tokens.map(([name, value]) => `${tokenVarName(name)}: ${value};`),
    ...STATUS_NAMES.map((name) => `${statusVar(name, 'color')}: ${palette.statuses[name][scheme]};`),
  ];
  const iconVars = STATUS_NAMES.map((name) => `${statusVar(name, 'icon')}: '${palette.statuses[name].icon}';`);

  const css = [
    cssHeader(),
    '',
    ':root {',
    '  color-scheme: light;',
    ...declarations(colourVars('light', light.tokens), '  '),
    ...declarations(iconVars, '  '),
    '}',
    '',
    `:root[${SCHEME_ATTRIBUTE}='dark'] {`,
    '  color-scheme: dark;',
    ...declarations(colourVars('dark', dark.tokens), '  '),
    '}',
    '',
    '@media (prefers-color-scheme: dark) {',
    `  :root:not([${SCHEME_ATTRIBUTE}='light']) {`,
    '    color-scheme: dark;',
    ...declarations(colourVars('dark', dark.tokens), '    '),
    '  }',
    '}',
    '',
  ].join('\n');

  const json: TokenArtifactJson = {
    _generated: `${GENERATED} Compiled by ${REGENERATE}.`,
    schema: 'onex.design-tokens/1',
    source: {
      catalog_version: semver(capture.catalog.catalog_version),
      palette_version: palette.palette_version,
      themes: { light: light.entry, dark: dark.entry },
    },
    tokens: {
      light: Object.fromEntries(light.tokens),
      dark: Object.fromEntries(dark.tokens),
    },
    status: Object.fromEntries(STATUS_NAMES.map((name) => [name, { ...palette.statuses[name] }])),
  };
  const jsonText = `${JSON.stringify(json, null, 2)}\n`;

  const manifest: TokenArtifactManifest = {
    _generated: `${GENERATED} Compiled by ${REGENERATE}.`,
    algorithm: 'sha256',
    files: [
      { path: ARTIFACT_CSS_PATH, sha256: sha256(css) },
      { path: ARTIFACT_JSON_PATH, sha256: sha256(jsonText) },
    ],
  };

  return [
    { path: ARTIFACT_CSS_PATH, contents: css },
    { path: ARTIFACT_JSON_PATH, contents: jsonText },
    { path: ARTIFACT_MANIFEST_PATH, contents: `${JSON.stringify(manifest, null, 2)}\n` },
  ];
}

/**
 * Compare emitted files to a fresh build, by bytes.
 *
 * A recorded checksum can be updated in the same commit as a hand-edit; the
 * source cannot, so the comparison is against the fresh build itself.
 *
 * @param fresh - The artifacts a fresh build produces.
 * @param read - Reads the checked-in contents of a repo-relative path, or undefined when it is missing.
 * @returns One line per artifact that is missing or differs; empty when none drifted.
 */
export function findDrift(
  fresh: readonly CompiledArtifact[],
  read: (path: string) => string | undefined,
): string[] {
  const drifted: string[] = [];
  for (const artifact of fresh) {
    const onDisk = read(artifact.path);
    if (onDisk === undefined) {
      drifted.push(`${artifact.path}: missing — never compiled, or deleted`);
    } else if (onDisk !== artifact.contents) {
      drifted.push(
        `${artifact.path}: checked in sha256:${sha256(onDisk)}, fresh compile sha256:${sha256(artifact.contents)}`,
      );
    }
  }
  return drifted;
}
