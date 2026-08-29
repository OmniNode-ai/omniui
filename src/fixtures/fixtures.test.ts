// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The fixtures must satisfy the contracts they claim to be captured from
 * (OMN-16889).
 *
 * A fixture that nothing validates is a hand-written guess wearing a
 * contract's name. These tests are what make "captured from a declared
 * exposure" a checkable claim rather than a comment.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

import { themeToCssProperties } from '../theme/css-variables.js';
import { assertReportableTheme } from '../theme/theme-token-set.js';
import {
  CONSUMER_FLOW_EXPOSURE,
  CONSUMER_FLOW_RESPONSE,
  THEME_CATALOG,
  THEME_INSTANCES,
  fixtureTheme,
  fixtureThemeIds,
} from './index.js';

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'schema', 'onex-models.json');
const combined = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as {
  $defs: Record<string, object>;
};

function validatorFor(defName: string): (value: unknown) => boolean {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema({ $id: 'onex-models', $defs: combined.$defs }, 'onex-models');
  const validate = ajv.compile({ $ref: `onex-models#/$defs/${defName}` });
  return (value: unknown) => {
    const ok = validate(value);
    if (!ok) {
      throw new Error(
        `${defName} validation failed: ${JSON.stringify(validate.errors, null, 2)}`,
      );
    }
    return ok;
  };
}

describe('captured theme catalog', () => {
  it('validates against ModelThemeCatalog from the generated mirror', () => {
    expect(validatorFor('ModelThemeCatalog')(THEME_CATALOG)).toBe(true);
  });

  it('validates every instance against ModelThemeInstance', () => {
    const validate = validatorFor('ModelThemeInstance');
    for (const instance of Object.values(THEME_INSTANCES)) {
      expect(validate(instance)).toBe(true);
    }
  });

  it('carries an instance for every catalog entry and no orphans', () => {
    expect(fixtureThemeIds()).toStrictEqual(Object.keys(THEME_INSTANCES).sort());
  });

  it('captures the three themes Phase C1 published', () => {
    expect(fixtureThemeIds()).toStrictEqual([
      'onex.theme.dark',
      'onex.theme.light',
      'onex.theme.warm',
    ]);
  });

  it('carries a catalog-issued digest, not one this repo recomputed', () => {
    for (const entry of THEME_CATALOG.entries) {
      expect(entry.content_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
    // Three distinct themes must not share a digest; an identical digest across
    // entries would mean the capture recorded one instance three times.
    const digests = THEME_CATALOG.entries.map((entry) => entry.content_digest);
    expect(new Set(digests).size).toBe(digests.length);
  });
});

describe('fixtureTheme', () => {
  it('produces a reportable theme for every catalog entry', () => {
    for (const themeId of fixtureThemeIds()) {
      const theme = fixtureTheme(themeId);
      expect(() => {
        assertReportableTheme(theme);
      }).not.toThrow();
      expect(theme.identity.themeId).toBe(themeId);
    }
  });

  it('drops the token set header rather than publishing it as a token', () => {
    const theme = fixtureTheme('onex.theme.dark');
    expect(theme.tokens.theme_id).toBeUndefined();
    expect(theme.tokens.contract_version).toBeUndefined();
    expect(theme.tokens.color_accent_primary).toBe('#6366f1');
  });

  it('publishes every captured theme without a custom-property collision', () => {
    for (const themeId of fixtureThemeIds()) {
      expect(() => themeToCssProperties(fixtureTheme(themeId))).not.toThrow();
    }
  });

  it('refuses a theme id the catalog does not carry', () => {
    expect(() => fixtureTheme('onex.theme.nope')).toThrow(/no captured theme instance/);
  });
});

describe('consumer-flow projection fixture', () => {
  const columns = CONSUMER_FLOW_EXPOSURE.columns;

  it('is the bus-backed exposure OMN-16777 declared', () => {
    expect(CONSUMER_FLOW_EXPOSURE.topic).toBe('onex.snapshot.projection.consumer-flow.v1');
    expect(CONSUMER_FLOW_EXPOSURE.bus_backed).toBe(true);
    expect(CONSUMER_FLOW_EXPOSURE.key_columns).toStrictEqual([
      'consumer_group',
      'topic',
      'window_start',
    ]);
  });

  it('gives every row exactly the declared columns, in declared order', () => {
    for (const row of CONSUMER_FLOW_RESPONSE.rows) {
      expect(Object.keys(row)).toStrictEqual(columns);
    }
  });

  it('covers every declared flow_state', () => {
    const seen = CONSUMER_FLOW_RESPONSE.rows.map((row) => row.flow_state).sort();
    expect(seen).toStrictEqual([...CONSUMER_FLOW_EXPOSURE.value_domains.flow_state].sort());
  });

  it('keeps an unobserved window null rather than zero (OMN-16777 AC5)', () => {
    const unknown = CONSUMER_FLOW_RESPONSE.rows.find((row) => row.flow_state === 'UNKNOWN');
    expect(unknown).toBeDefined();
    for (const column of CONSUMER_FLOW_EXPOSURE.nullable_columns) {
      expect(unknown?.[column as keyof typeof unknown]).toBeNull();
    }
  });

  it('carries the canonical STALLED case: everything in, nothing out (AC2)', () => {
    const stalled = CONSUMER_FLOW_RESPONSE.rows.find((row) => row.flow_state === 'STALLED');
    expect(stalled?.messages_in).toBe(15750);
    expect(stalled?.messages_out).toBe(0);
  });

  it('distinguishes STARVED from IDLE by upstream evidence, not by counters', () => {
    const starved = CONSUMER_FLOW_RESPONSE.rows.find((row) => row.flow_state === 'STARVED');
    const idle = CONSUMER_FLOW_RESPONSE.rows.find((row) => row.flow_state === 'IDLE');
    expect(starved?.messages_in).toBe(0);
    expect(idle?.messages_in).toBe(0);
    expect(starved?.upstream_evidence).toBe('PRODUCED');
    expect(idle?.upstream_evidence).toBe('SILENT');
  });

  it('reports the row count it actually carries', () => {
    expect(CONSUMER_FLOW_RESPONSE.row_count).toBe(CONSUMER_FLOW_RESPONSE.rows.length);
  });
});
