// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * G1A.5 — TS mirror freshness (OMN-16889).
 *
 * > **Passes when:** regenerating from `emit_ts_types.py` produces a mirror
 * > containing the theme schema and the C2 envelope.
 * > **Falsified by:** either symbol still missing after regeneration.
 *
 * The regeneration half runs upstream and cannot run in this repo's CI — it
 * needs an `omnibase_core` checkout and a Python toolchain. What CI *can*
 * enforce, and what this file enforces, is the half that actually rots:
 *
 * 1. the checked-in schema is the one `schema/PROVENANCE.md` claims (digest);
 * 2. the checked-in TypeScript is a faithful mirror of that schema (symbols);
 * 3. the gate-named symbols are present on both sides.
 *
 * Splitting it this way is deliberate. A gate whose only proof is "someone ran
 * the script once" is the shape of failure the plan calls Stall 1 — a pipeline
 * whose output nothing downstream ever consumed. This makes the consuming half
 * mechanical.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const SCHEMA_PATH = join(REPO_ROOT, 'schema', 'onex-models.json');
const PROVENANCE_PATH = join(REPO_ROOT, 'schema', 'PROVENANCE.md');
const MIRROR_PATH = join(HERE, 'onex-models.ts');

/** Symbols G1A.5 names by hand, plus the ones Phase 1B will bind. */
const GATE_SYMBOLS = [
  // the theme schema half
  'ModelRendererThemeContract',
  'ModelThemeInstance',
  'ModelThemeCatalog',
  'ModelThemeCatalogEntry',
  'ModelThemeActivation',
  // the C2 envelope half
  'ModelWidgetEnvelope',
  'ModelWidgetProvenance',
  'ModelComponentContract',
  'ModelDataBindingContract',
];

const schemaRaw = readFileSync(SCHEMA_PATH, 'utf8');
const schema = JSON.parse(schemaRaw) as { $defs: Record<string, unknown> };
const mirror = readFileSync(MIRROR_PATH, 'utf8');
const provenance = readFileSync(PROVENANCE_PATH, 'utf8');

describe('G1A.5 — TS mirror freshness', () => {
  it('carries the theme schema and the C2 envelope in the JSON schema', () => {
    const missing = GATE_SYMBOLS.filter((name) => !(name in schema.$defs));
    expect(missing).toStrictEqual([]);
  });

  it('carries the same symbols in the generated TypeScript', () => {
    const missing = GATE_SYMBOLS.filter(
      (name) => !new RegExp(`^export (?:interface|type) ${name}\\b`, 'm').test(mirror),
    );
    expect(missing).toStrictEqual([]);
  });

  it('checks in the exact schema PROVENANCE.md records', () => {
    const digest = createHash('sha256').update(schemaRaw, 'utf8').digest('hex');
    expect(provenance).toContain(digest);
  });

  it('records the source commit the schema was emitted from', () => {
    expect(provenance).toMatch(/\| Commit \| `[0-9a-f]{40}`/);
  });

  it('agrees with PROVENANCE.md on how many definitions the schema carries', () => {
    const declared = /\| `\$defs` count \| (\d+) \|/.exec(provenance)?.[1];
    expect(declared).toBeDefined();
    expect(Object.keys(schema.$defs).length).toBe(Number(declared));
  });

  it('never hand-edits the mirror', () => {
    expect(mirror).toContain('GENERATED FILE — DO NOT EDIT.');
  });
});
