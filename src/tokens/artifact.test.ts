// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The framework-free token artifact (OMN-21848): one typed source, one build,
 * contrast proved by computation, no React, drift that fails, and two builds
 * that are byte-identical.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { designTokens, type ThemeCatalogCapture } from './compile.js';
import {
  ARTIFACT_CSS_PATH,
  ARTIFACT_JSON_PATH,
  ARTIFACT_MANIFEST_PATH,
  compileTokenArtifact,
  findDrift,
  type TokenArtifactJson,
  type TokenArtifactManifest,
} from './models/artifact.js';
import { STATUS_NAMES, parseStatusPalette } from './models/status-palette.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadCapture(): ThemeCatalogCapture {
  const raw = JSON.parse(readFileSync(join(REPO_ROOT, 'themes', 'theme-catalog.capture.json'), 'utf8')) as ThemeCatalogCapture;
  return { catalog: raw.catalog, instances: raw.instances };
}

function loadPaletteDocument(): unknown {
  return JSON.parse(readFileSync(join(REPO_ROOT, 'themes', 'status-palette.json'), 'utf8'));
}

function build(): ReturnType<typeof compileTokenArtifact> {
  return compileTokenArtifact(loadCapture(), parseStatusPalette(loadPaletteDocument()));
}

function contentsOf(path: string): string {
  const artifact = build().find((candidate) => candidate.path === path);
  if (artifact === undefined) throw new Error(`no artifact ${path}`);
  return artifact.contents;
}

function sha256(contents: string): string {
  return createHash('sha256').update(contents, 'utf8').digest('hex');
}

/** WCAG 2.x relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('artifact source', () => {
  it('source: the tokens are typed data, the palette loader rejects what the artifact cannot render', () => {
    const doc = loadPaletteDocument() as { statuses: Record<string, Record<string, string>> };
    expect(Object.keys(parseStatusPalette(doc).statuses)).toStrictEqual([...STATUS_NAMES]);

    const missing = structuredClone(doc);
    delete missing.statuses.stale;
    expect(() => parseStatusPalette(missing)).toThrow(TypeError);

    const extra = structuredClone(doc);
    extra.statuses.sleeping = { light: 'x', dark: 'x', icon: 'status.sleeping', icon_id: 'moon' };
    expect(() => parseStatusPalette(extra)).toThrow(/unknown status/);

    const badColour = structuredClone(doc);
    badColour.statuses.moving = { ...badColour.statuses.moving, light: 'not-a-colour' };
    expect(() => parseStatusPalette(badColour)).toThrow(TypeError);
  });

  it('source: emits css with light default plus dark under a selector and a prefers-color-scheme query, and typed json of the same tokens', () => {
    const css = contentsOf(ARTIFACT_CSS_PATH);
    expect(css).toContain(':root {');
    expect(css).toContain("[data-onex-color-scheme='dark']");
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    // both are documented in the header, before the first rule
    const header = css.slice(0, css.indexOf(':root {'));
    expect(header).toContain("data-onex-color-scheme='dark'");
    expect(header).toContain('prefers-color-scheme: dark');

    const json = JSON.parse(contentsOf(ARTIFACT_JSON_PATH)) as TokenArtifactJson;
    const capture = loadCapture();
    expect(json.schema).toBe('onex.design-tokens/1');
    expect(Object.entries(json.tokens.light)).toStrictEqual(designTokens(capture.instances['onex.theme.light']!));
    expect(Object.entries(json.tokens.dark)).toStrictEqual(designTokens(capture.instances['onex.theme.dark']!));
    for (const [name, value] of Object.entries(json.tokens.light)) {
      expect(css).toContain(`--onex-${name.replaceAll('_', '-')}: ${value};`);
    }
    for (const name of STATUS_NAMES) {
      expect(css).toContain(`--onex-status-${name}-color: ${json.status[name]!.light};`);
      expect(css).toContain(`--onex-status-${name}-icon: '${json.status[name]!.icon}';`);
    }
  });

  it('source: no colour literal lives in the emitting source outside the data files', () => {
    const colour = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(/;
    for (const file of [
      'src/tokens/models/artifact.ts',
      'src/tokens/models/status-palette.ts',
      'scripts/compile-tokens.ts',
    ]) {
      expect(readFileSync(join(REPO_ROOT, file), 'utf8'), file).not.toMatch(colour);
    }
  });
});

describe('artifact contrast', () => {
  const palette = parseStatusPalette(loadPaletteDocument());
  const capture = loadCapture();

  it('contrast: the six names exist and each names a distinct icon token', () => {
    expect(Object.keys(palette.statuses)).toStrictEqual(['moving', 'waiting', 'blocked', 'stopped', 'unread', 'stale']);
    const icons = STATUS_NAMES.map((name) => palette.statuses[name].icon);
    expect(new Set(icons).size).toBe(icons.length);
    for (const name of STATUS_NAMES) {
      expect(palette.statuses[name].icon).toBe(`status.${name}`);
    }
  });

  it.each(STATUS_NAMES.flatMap((name) => (['light', 'dark'] as const).map((scheme) => [name, scheme] as const)))(
    'contrast: %s on %s reaches 4.5:1 against its theme surface',
    (name, scheme) => {
      const surface = new Map(designTokens(capture.instances[palette.themes[scheme]]!)).get(palette.surface_token)!;
      const ratio = contrast(palette.statuses[name][scheme], surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('contrast: the ratio function matches the known black on white value', () => {
    // positive control: a function that returned 21 for everything would pass the cases above
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeLessThan(4.5);
  });
});

/** Relative import specifiers of a source file, and every bare specifier it names. */
function specifiers(text: string): string[] {
  return [...text.matchAll(/(?:from\s+|import\s*\(?\s*|require\(\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]!);
}

function importClosure(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    const found = specifiers(readFileSync(file, 'utf8'));
    seen.set(file, found);
    for (const spec of found) {
      if (!spec.startsWith('.')) continue;
      const base = resolve(dirname(file), spec.replace(/\.js$/, ''));
      const next = ['.ts', '.tsx', '/index.ts'].map((ext) => `${base}${ext}`).find((candidate) => existsSync(candidate));
      if (next !== undefined) queue.push(next);
    }
  }
  return seen;
}

describe('artifact no-react', () => {
  const REACT = /(^|[^a-z])react(-dom)?([^a-z]|$)/i;

  it('no-react: the emitted files contain no import, require or react reference', () => {
    for (const artifact of build()) {
      expect(artifact.contents, artifact.path).not.toMatch(REACT);
      expect(artifact.contents, artifact.path).not.toMatch(/\bimport\b|\brequire\b/);
    }
  });

  it('no-react: the emitting code path imports nothing from react', () => {
    for (const entry of ['scripts/compile-tokens.ts', 'src/tokens/models/artifact.ts']) {
      const closure = importClosure(join(REPO_ROOT, entry));
      expect(closure.size).toBeGreaterThan(1);
      for (const [file, found] of closure) {
        const bad = found.filter((spec) => /^react(-dom)?(\/|$)/.test(spec) || spec.startsWith('@types/react'));
        expect(bad, relative(REPO_ROOT, file)).toStrictEqual([]);
      }
    }
  });

  it('no-react: the checker would catch a react import (positive control)', () => {
    expect(specifiers("import { useState } from 'react';\nimport x from './x.js';")).toStrictEqual(['react', './x.js']);
  });
});

describe('artifact drift', () => {
  const read = (overrides: Record<string, string> = {}) => (path: string): string | undefined =>
    path in overrides ? overrides[path] : readFileSync(join(REPO_ROOT, path), 'utf8');

  it('drift: the checked-in artifact equals a fresh build, byte for byte', () => {
    expect(findDrift(build(), read())).toStrictEqual([]);
  });

  it('drift: a hand-edited value in any emitted file is reported', () => {
    for (const path of [ARTIFACT_CSS_PATH, ARTIFACT_JSON_PATH, ARTIFACT_MANIFEST_PATH]) {
      const fresh = contentsOf(path);
      const edited = fresh.replace(/[0-9a-f]/, (digit) => (digit === '0' ? '1' : '0'));
      expect(edited).not.toBe(fresh);
      expect(findDrift(build(), read({ [path]: edited })), path).toHaveLength(1);
    }
  });

  it('drift: a missing emitted file is reported', () => {
    expect(findDrift(build(), (path) => (path === ARTIFACT_CSS_PATH ? undefined : read()(path)))).toHaveLength(1);
  });

  it('drift: a changed palette value changes the emitted bytes', () => {
    const doc = structuredClone(loadPaletteDocument()) as { statuses: Record<string, Record<string, string>> };
    doc.statuses.moving!.dark = '#000000';
    const changed = compileTokenArtifact(loadCapture(), parseStatusPalette(doc));
    expect(findDrift(changed, read()).length).toBeGreaterThan(0);
  });
});

describe('artifact deterministic', () => {
  it('deterministic: two builds are byte-identical', () => {
    expect(build()).toStrictEqual(build());
  });

  it('deterministic: input key order does not change the output', () => {
    const capture = loadCapture();
    const reversed: ThemeCatalogCapture = {
      catalog: { ...capture.catalog, entries: [...capture.catalog.entries].reverse() },
      instances: Object.fromEntries(Object.entries(capture.instances).reverse()),
    };
    const palette = parseStatusPalette(loadPaletteDocument());
    expect(compileTokenArtifact(reversed, palette)).toStrictEqual(compileTokenArtifact(capture, palette));
  });

  it('deterministic: the manifest records the sha256 of each emitted file', () => {
    const manifest = JSON.parse(contentsOf(ARTIFACT_MANIFEST_PATH)) as TokenArtifactManifest;
    expect(manifest.files.map((file) => file.path)).toStrictEqual([ARTIFACT_CSS_PATH, ARTIFACT_JSON_PATH]);
    for (const file of manifest.files) {
      expect(file.sha256).toBe(sha256(contentsOf(file.path)));
      expect(file.sha256).toBe(sha256(readFileSync(join(REPO_ROOT, file.path), 'utf8')));
    }
  });

  it('deterministic: no clock, absolute path or environment value in the output', () => {
    for (const artifact of build()) {
      expect(artifact.contents, artifact.path).not.toMatch(/\b20\d\d-\d\d-\d\dT\d\d:/);
      expect(artifact.contents, artifact.path).not.toContain(REPO_ROOT);
      expect(artifact.contents, artifact.path).not.toMatch(/\/(home|Users|data)\//);
    }
  });

  it('deterministic: the artifact directory holds exactly the three declared files', () => {
    const dir = join(REPO_ROOT, 'src', 'generated', 'tokens', 'artifact');
    expect(statSync(dir).isDirectory()).toBe(true);
    expect(readdirSync(dir).sort()).toStrictEqual(['manifest.json', 'onex-tokens.css', 'onex-tokens.json']);
  });
});
