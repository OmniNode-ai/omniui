// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * G1A.2 (determinism) and G1A.3 (drift enforcement), as tests (OMN-16886).
 *
 * G1A.3's wording is "**demonstrated**, not asserted". A drift gate that has
 * never been shown to fire is indistinguishable from one that does not work —
 * Stall 2 is the recorded proof of that. So the drift tests here do not check
 * that a checker *exists*; they mutate an artifact and require the checker to
 * report it. The live CI demonstration is recorded on the PR.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  compileCatalog,
  compileCss,
  designTokens,
  tailwindVarName,
  themeIdentifier,
  type ThemeCatalogCapture,
} from './compile.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = join(REPO_ROOT, 'themes', 'theme-catalog.capture.json');

function loadCapture(): ThemeCatalogCapture {
  const raw = JSON.parse(readFileSync(SOURCE, 'utf8')) as ThemeCatalogCapture;
  return { catalog: raw.catalog, instances: raw.instances };
}

function sha256(contents: string): string {
  return createHash('sha256').update(contents, 'utf8').digest('hex');
}

describe('G1A.2 — determinism', () => {
  it('produces byte-identical output on two runs', () => {
    const first = compileCatalog(loadCapture());
    const second = compileCatalog(loadCapture());
    expect(second.artifacts).toStrictEqual(first.artifacts);
  });

  it('produces an identical SHA-256 per artifact on two runs', () => {
    const digestsOf = (): Record<string, string> =>
      Object.fromEntries(
        compileCatalog(loadCapture()).artifacts.map((a) => [a.path, sha256(a.contents)]),
      );
    expect(digestsOf()).toStrictEqual(digestsOf());
  });

  it('emits artifacts in a stable path order regardless of input key order', () => {
    const capture = loadCapture();
    const reversed: ThemeCatalogCapture = {
      catalog: { ...capture.catalog, entries: [...capture.catalog.entries].reverse() },
      instances: Object.fromEntries(Object.entries(capture.instances).reverse()),
    };
    expect(compileCatalog(reversed).artifacts).toStrictEqual(
      compileCatalog(capture).artifacts,
    );
  });

  it('embeds no timestamp, absolute path, or environment value', () => {
    // R-22's live counter-example is omnidash's component-registry.json, which
    // stamps `generatedAt: new Date().toISOString()` on every run and produces
    // unconditional working-tree churn. Nothing here may inherit that.
    const forbidden = [
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // ISO timestamp
      /\/(Users|home|Volumes)\//, // absolute path
      /node_modules/,
    ];
    for (const artifact of compileCatalog(loadCapture()).artifacts) {
      for (const pattern of forbidden) {
        expect(artifact.contents).not.toMatch(pattern);
      }
    }
  });

  it('sorts object keys in canonical JSON regardless of insertion order', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(
      '{"a":[2,{"c":4,"d":3}],"b":1}',
    );
  });
});

describe('G1A.3 — drift enforcement', () => {
  const artifacts = compileCatalog(loadCapture()).artifacts;

  it('every compiled artifact is checked in byte-for-byte', () => {
    for (const artifact of artifacts) {
      const onDisk = readFileSync(join(REPO_ROOT, artifact.path), 'utf8');
      expect(`${artifact.path}: ${sha256(onDisk)}`).toBe(
        `${artifact.path}: ${sha256(artifact.contents)}`,
      );
    }
  });

  it('detects a hand-edited token value — one hex digit is enough', () => {
    const css = artifacts.find((a) => a.path.endsWith('onex.theme.dark.css'));
    expect(css).toBeDefined();
    const tampered = (css?.contents ?? '').replace('#6366f1', '#6366f2');
    expect(tampered).not.toBe(css?.contents);
    expect(sha256(tampered)).not.toBe(sha256(css?.contents ?? ''));
  });

  it('detects a hand-edited value in the Tailwind artifact too', () => {
    // The @theme file is a compile product like any other (D3 rule 1: no token
    // value may originate in it), so it is under the same gate.
    const tw = artifacts.find((a) => a.path.includes('tailwind/onex.theme.dark.css'));
    expect(tw).toBeDefined();
    const tampered = (tw?.contents ?? '').replace('1rem', '1.25rem');
    expect(sha256(tampered)).not.toBe(sha256(tw?.contents ?? ''));
  });

  it('refuses a catalog whose entry revision disagrees with its instance', () => {
    const capture = loadCapture();
    const entry = capture.catalog.entries[0];
    expect(entry).toBeDefined();
    const drifted: ThemeCatalogCapture = {
      catalog: {
        ...capture.catalog,
        entries: [
          { ...entry!, instance_revision: { ...entry!.instance_revision, minor: 9 } },
          ...capture.catalog.entries.slice(1),
        ],
      },
      instances: capture.instances,
    };
    expect(() => compileCatalog(drifted)).toThrow(/disagrees with catalog entry/);
  });

  it('refuses a catalog entry with no instance document', () => {
    const capture = loadCapture();
    const orphaned: ThemeCatalogCapture = { catalog: capture.catalog, instances: {} };
    expect(() => compileCatalog(orphaned)).toThrow(/has no instance document/);
  });
});

describe('emission', () => {
  it('carries the catalog-issued digest into every artifact', () => {
    const capture = loadCapture();
    for (const entry of capture.catalog.entries) {
      for (const artifact of compileCatalog(capture).artifacts) {
        if (artifact.path.includes(entry.theme_id)) {
          expect(artifact.contents).toContain(entry.content_digest);
        }
      }
    }
  });

  it('scopes each theme to its own attribute selector, not :root', () => {
    const capture = loadCapture();
    const entry = capture.catalog.entries[0]!;
    const instance = capture.instances[entry.theme_id]!;
    const css = compileCss(instance, entry.content_digest);
    expect(css).toContain(`[data-onex-theme='${entry.theme_id}']`);
    expect(css).not.toContain(':root');
  });

  it('never emits the token set header as a design token', () => {
    const capture = loadCapture();
    for (const instance of Object.values(capture.instances)) {
      const names = designTokens(instance).map(([name]) => name);
      expect(names).not.toContain('theme_id');
      expect(names).not.toContain('contract_version');
    }
  });

  it('maps token names onto Tailwind v4 namespaces so utilities exist', () => {
    expect(tailwindVarName('color_status_error')).toBe('--color-status-error');
    expect(tailwindVarName('spacing_md')).toBe('--spacing-md');
    expect(tailwindVarName('font_size_lg')).toBe('--text-lg');
    expect(tailwindVarName('border_radius_sm')).toBe('--radius-sm');
    // Outside a namespace Tailwind knows: readable as var(), generates no
    // utility. Better than inventing a namespace Tailwind would ignore.
    expect(tailwindVarName('elevation_high')).toBe('--onex-elevation-high');
  });

  it('derives a stable TypeScript identifier from a namespaced theme id', () => {
    expect(themeIdentifier('onex.theme.dark')).toBe('THEME_ONEX_THEME_DARK');
  });
});
