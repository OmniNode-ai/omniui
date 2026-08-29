// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The seals, re-derived in TypeScript (OMN-16935).
 *
 * `scripts/capture_widget_envelopes.py` sealed these envelopes in Python, using
 * `omnibase_core`'s own `seal_widget_envelope`. This file recomputes every one
 * of those seals in TypeScript, from the committed bytes, with an independent
 * canonical-JSON writer and an independent SHA-256. If the two implementations
 * ever disagree — about float spelling, about `None` stripping, about
 * separators — this goes red, and it goes red in a required status check.
 *
 * That agreement is the thing the whole Plane-1 story rests on. "A consumer can
 * validate a discovered widget without trusting the publisher" is only true if
 * the consumer can compute the publisher's digest. Until this test existed,
 * that was an assertion.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

import {
  acceptEnvelope,
  acceptEnvelopeNode,
  computeEnvelopeDigest,
  parseJsonSource,
} from '../binding/index.js';
import type { JsonSourceValue } from '../binding/index.js';
import { hasIcon } from '../components/Icon.js';
import type {
  ModelWidgetConfigStatusGrid,
  ModelWidgetEnvelope,
} from '../generated/onex-models.js';

import {
  CONSUMER_FLOW_BACKLOG,
  CONSUMER_FLOW_THROUGHPUT,
  SYSTEM_HEALTH_BOARD,
  WIDGET_ENVELOPES,
  WIDGET_ENVELOPE_SOURCES,
  consumerFlowDatasets,
  throughputDatasets,
} from './widgets.js';

const SCHEMA_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'schema',
  'onex-models.json',
);
const combined = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as {
  $defs: Record<string, object>;
};

/**
 * Compile a validator for one schema definition.
 *
 * @param defName - The `$defs` entry to validate against.
 * @returns A validator that throws with the errors rather than returning false.
 */
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

/**
 * Pull the envelope subtree out of a capture document.
 *
 * @param source - The capture document's text.
 * @returns The envelope subtree, number literals intact.
 */
function envelopeNode(source: string): Record<string, JsonSourceValue> {
  const document = parseJsonSource(source) as Record<string, JsonSourceValue>;
  return document.envelope as Record<string, JsonSourceValue>;
}

describe('captured widget envelopes', () => {
  it('captures one envelope per Phase 1B component type', () => {
    expect(Object.keys(WIDGET_ENVELOPE_SOURCES).sort()).toStrictEqual([
      'consumer-flow-backlog',
      'consumer-flow-throughput',
      'system-health-board',
    ]);
  });

  it('re-derives every seal Python computed, byte for byte', () => {
    for (const [name, source] of Object.entries(WIDGET_ENVELOPE_SOURCES)) {
      const node = envelopeNode(source);
      const declared = node.content_digest;
      expect(typeof declared, name).toBe('string');
      expect(computeEnvelopeDigest(node), name).toBe(declared);
    }
  });

  it('validates against ModelWidgetEnvelope from the generated mirror', () => {
    const validate = validatorFor('ModelWidgetEnvelope');
    for (const envelope of WIDGET_ENVELOPES) {
      if (envelope.widget_id === 'onex.widget.consumer_flow_backlog') {
        // Excluded, and the exclusion is itself asserted in the next test. See
        // the finding recorded there: the metric-card config cannot satisfy
        // both its seal and its published schema at the same time, and that is
        // an upstream defect rather than a fixture mistake.
        continue;
      }
      expect(validate(envelope), envelope.widget_id).toBe(true);
    }
  });

  it('records the upstream alias defect: a sealed metric card fails its own schema', () => {
    // FINDING (upstream, Phase C2 / OMN-16883). `ModelWidgetConfigMetricCard`
    // declares `value_format` with `alias="format"`. The published JSON Schema
    // comes from `model_json_schema()`, which serialises BY ALIAS, so the
    // schema says `format` and forbids additional properties. The seal comes
    // from `model_dump(mode="json")` in `compute_widget_envelope_digest`, which
    // serialises BY FIELD NAME, so the sealed bytes say `value_format`.
    //
    // The two cannot both be satisfied. An envelope written in the wire form
    // its schema describes digests to something other than its seal; an
    // envelope written in the form its seal covers is rejected by its schema.
    // Every aliased field in the widget-config union has this property —
    // `ModelWidgetConfigEventFeed.event_filter`/`filter` is the other one.
    //
    // omniui cannot fix it: the digest and the schema are both produced in
    // `omnibase_core`, and Phase 1B commits nothing there. So the mismatch is
    // pinned here instead. **When core resolves it, this test goes red**, which
    // is the signal to re-run `scripts/capture_widget_envelopes.py` and move
    // the backlog envelope back into the test above.
    const validate = validatorFor('ModelWidgetEnvelope');
    expect(() => validate(CONSUMER_FLOW_BACKLOG)).toThrow(/value_format/);
    const config = CONSUMER_FLOW_BACKLOG.config as Record<string, unknown>;
    expect(config.value_format).toBe('number');
    expect(config.format).toBeUndefined();
  });

  it('rejects an envelope whose content moved without its seal', () => {
    // Edit one string in the received bytes, exactly as an intermediary would.
    const tampered = (WIDGET_ENVELOPE_SOURCES['system-health-board'] ?? '').replace(
      '"System health"',
      '"Something else"',
    );
    expect(tampered).not.toBe(WIDGET_ENVELOPE_SOURCES['system-health-board']);
    expect(() => acceptEnvelopeNode(envelopeNode(tampered))).toThrow(/fails its seal/);
  });

  it('stops verifying once a JSON.parse round-trip has destroyed the literals', () => {
    // This is the regression that justifies `json-source.ts` existing at all.
    // A round-trip through JSON.parse/stringify rewrites the float 1840.0 as
    // 1840 — same JSON value, different sealed bytes — so the seal no longer
    // holds. If this test ever passes, the parser stopped preserving literals
    // and every seal check in this repo silently became approximate.
    const roundTripped = JSON.stringify(envelopeNodeAsPlainJson('system-health-board'));
    expect(() => acceptEnvelope(roundTripped)).toThrow(/fails its seal/);
  });

  it('rejects an envelope whose component kind and config kind disagree', () => {
    // Re-seal a contradictory envelope so it passes the digest check and fails
    // only on the cross-field rule. A test that let the seal catch it would
    // prove nothing about the second check.
    const node = envelopeNode(WIDGET_ENVELOPE_SOURCES['system-health-board'] ?? '');
    const component = { ...(node.component as Record<string, JsonSourceValue>) };
    component.component_kind = 'chart';
    const contradiction: Record<string, JsonSourceValue> = { ...node, component };
    delete contradiction.content_digest;
    const resealed: Record<string, JsonSourceValue> = {
      ...contradiction,
      content_digest: computeEnvelopeDigest(contradiction),
    };
    expect(() => acceptEnvelopeNode(resealed)).toThrow(/does not match config_kind/);
  });

  it('refuses a malformed content_digest before doing any work', () => {
    expect(() => acceptEnvelope('{"content_digest": "nope"}')).toThrow(/content_digest must be/);
  });
});

describe('the system-health board envelope', () => {
  it('is a status grid carrying every declared severity role exactly once', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const severities = (config.severity_roles ?? []).map((role) => role.severity).sort();
    expect(severities).toStrictEqual(['attention', 'critical', 'nominal', 'unknown']);
  });

  it('gives every severity a distinct label and a distinct icon', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const roles = config.severity_roles ?? [];
    expect(new Set(roles.map((role) => role.label)).size).toBe(roles.length);
    expect(new Set(roles.map((role) => role.icon)).size).toBe(roles.length);
  });

  it('names only icons this library can actually draw', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    for (const role of config.severity_roles ?? []) {
      expect(hasIcon(role.icon), role.icon).toBe(true);
    }
    for (const item of config.items ?? []) {
      if (item.icon !== undefined && item.icon !== null) {
        expect(hasIcon(item.icon), item.icon).toBe(true);
      }
    }
  });

  it('carries a colour token NAME per severity, never a colour value', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    for (const role of config.severity_roles ?? []) {
      expect(role.theme_color_token).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('covers every flow_state the exposure declares, plus a tile with no read', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const statuses = (config.items ?? []).map((item) => item.verdict.status_value).sort();
    expect(statuses).toStrictEqual([
      'FLOWING',
      'IDLE',
      'NO_PROJECTION',
      'STALLED',
      'STARVED',
      'UNKNOWN',
    ]);
  });

  it('traces every verdict to a named, versioned, digested policy', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    for (const item of config.items ?? []) {
      expect(item.verdict.policy_id).toBe('onex.policy.consumer-flow-severity');
      expect(item.verdict.policy_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it('leaves the UNKNOWN tile without a secondary rather than showing it as zero', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const unknown = (config.items ?? []).find(
      (item) => item.verdict.status_value === 'UNKNOWN',
    );
    expect(unknown?.secondary ?? null).toBeNull();
    const starved = (config.items ?? []).find(
      (item) => item.verdict.status_value === 'STARVED',
    );
    // An observed zero is a reading and must survive as one. Conflating it with
    // the unobserved case is the false-green OMN-16777 exists to close.
    expect(starved?.secondary?.value).toBe(0);
  });

  it('declares a binding for every tile, keyed by the tile key', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const bindings = (SYSTEM_HEALTH_BOARD.component.data_bindings ?? []).map(
      (binding) => binding.binding_id,
    );
    expect((config.items ?? []).map((item) => item.key).sort()).toStrictEqual(bindings.sort());
  });
});

describe('the fixture host', () => {
  it('delivers a read for every binding except the projection that does not exist', () => {
    const datasets = consumerFlowDatasets();
    const bindings = (SYSTEM_HEALTH_BOARD.component.data_bindings ?? []).map(
      (binding) => binding.binding_id,
    );
    for (const bindingId of bindings) {
      if (bindingId === 'chain.liveness') {
        expect(datasets[bindingId]).toBeUndefined();
        continue;
      }
      expect(datasets[bindingId]?.rows).toHaveLength(1);
    }
  });

  it('can be told to omit a read, so a missing one is testable', () => {
    expect(consumerFlowDatasets({ omit: ['flow.gateway-forwarder'] })['flow.gateway-forwarder'])
      .toBeUndefined();
  });

  it('delivers the window series for the throughput binding', () => {
    expect(throughputDatasets().throughput?.rows).toHaveLength(8);
  });
});

describe('the trend and cluster envelopes', () => {
  it('leaves every chart series colour unset, so no fixture pins a hue', () => {
    const config = CONSUMER_FLOW_THROUGHPUT.config as {
      series?: readonly { color?: string | null }[];
    };
    for (const series of config.series ?? []) {
      expect(series.color ?? null).toBeNull();
    }
  });

  it('binds the cluster to one binding per consumer group', () => {
    expect(CONSUMER_FLOW_BACKLOG.component.data_bindings ?? []).toHaveLength(5);
  });

  it('declares a trend key, since it declares a trend', () => {
    const config = CONSUMER_FLOW_BACKLOG.config as {
      show_trend?: boolean;
      trend_key?: string | null;
    };
    expect(config.show_trend).toBe(true);
    expect(config.trend_key).toBe('messages_out');
  });
});

/**
 * The envelope subtree as ordinary JSON, for tests that need to mutate it.
 *
 * @param name - Which capture.
 * @returns The envelope as a plain object.
 */
function envelopeNodeAsPlainJson(name: string): ModelWidgetEnvelope {
  const source = WIDGET_ENVELOPE_SOURCES[name] ?? '';
  return (JSON.parse(source) as { envelope: ModelWidgetEnvelope }).envelope;
}
