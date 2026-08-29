// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Binding resolution, and the four reasons that must stay four (OMN-16935).
 *
 * `EnumEmptyStateReason`'s docstring forbids collapsing its values into each
 * other, and the reason that matters most here is the one that is easiest to
 * lose: a read that never happened is not a read that returned nothing. On a
 * health board those two render as very different facts.
 */

import { describe, expect, it } from 'vitest';

import type {
  ModelComponentContract,
  ModelDataBindingContract,
} from '../generated/onex-models.js';

import { orderRows, requireBinding, resolveBinding, type HostDatasets } from './resolve.js';

const TOPIC = 'onex.snapshot.projection.consumer-flow.v1';

const BINDING: ModelDataBindingContract = {
  binding_id: 'flow.one',
  projection_topic: TOPIC,
  ordering_authority_field: 'window_end',
  ordering_direction: 'descending',
  required_fields: ['consumer_group', 'flow_state'],
  cursor_field: null,
};

const COMPONENT: ModelComponentContract = {
  component_id: 'onex.component.test',
  component_kind: 'status_grid',
  title: 'Test',
  contract_version: { major: 1, minor: 0, patch: 0 },
  data_bindings: [BINDING],
  supported_empty_state_reasons: ['no-data', 'missing-field', 'upstream-blocked', 'schema-invalid'],
};

const ROW = {
  consumer_group: 'group.a',
  flow_state: 'FLOWING',
  window_end: '2026-01-01T00:05:00+00:00',
};

/**
 * A host that delivered one dataset.
 *
 * @param dataset - What to deliver for `flow.one`.
 * @returns The host datasets.
 */
function host(dataset: HostDatasets['x']): HostDatasets {
  return { 'flow.one': dataset };
}

describe('resolveBinding', () => {
  it('resolves rows the host delivered for the declared topic', () => {
    const result = resolveBinding(COMPONENT, BINDING, host({ projection_topic: TOPIC, rows: [ROW] }));
    expect(result.status).toBe('resolved');
    expect(result.status === 'resolved' ? result.rows : []).toStrictEqual([ROW]);
  });

  it('reports a read that never happened as upstream-blocked, not as no-data', () => {
    const result = resolveBinding(COMPONENT, BINDING, {});
    expect(result).toMatchObject({ status: 'empty', reason: 'upstream-blocked' });
  });

  it('reports a read that returned nothing as no-data', () => {
    const result = resolveBinding(COMPONENT, BINDING, host({ projection_topic: TOPIC, rows: [] }));
    expect(result).toMatchObject({ status: 'empty', reason: 'no-data' });
  });

  it('reports a wrongly wired read as schema-invalid', () => {
    const result = resolveBinding(
      COMPONENT,
      BINDING,
      host({ projection_topic: 'onex.snapshot.projection.something-else.v1', rows: [ROW] }),
    );
    expect(result).toMatchObject({ status: 'empty', reason: 'schema-invalid' });
  });

  it('reports an absent declared field as missing-field, naming the field', () => {
    const { flow_state: _dropped, ...withoutFlowState } = ROW;
    const result = resolveBinding(
      COMPONENT,
      BINDING,
      host({ projection_topic: TOPIC, rows: [withoutFlowState] }),
    );
    expect(result).toMatchObject({ status: 'empty', reason: 'missing-field' });
    expect(result.status === 'empty' ? result.detail : '').toContain('flow_state');
  });

  it('treats a null value as present — a null counter is a reading, not an absence', () => {
    // OMN-16777 AC5: null marks a window that was never observed, which is a
    // different fact from a missing column. Only the column's absence is a
    // missing-field; a null in it is data the renderer has to handle.
    const result = resolveBinding(
      COMPONENT,
      BINDING,
      host({ projection_topic: TOPIC, rows: [{ ...ROW, flow_state: null }] }),
    );
    expect(result.status).toBe('resolved');
  });

  it('requires the ordering authority even when it is not listed as required', () => {
    const { window_end: _dropped, ...withoutOrdering } = ROW;
    const result = resolveBinding(
      COMPONENT,
      BINDING,
      host({ projection_topic: TOPIC, rows: [withoutOrdering] }),
    );
    expect(result).toMatchObject({ status: 'empty', reason: 'missing-field' });
    expect(result.status === 'empty' ? result.detail : '').toContain('window_end');
  });

  it('refuses to surface a reason the component contract does not declare', () => {
    const narrow: ModelComponentContract = {
      ...COMPONENT,
      supported_empty_state_reasons: ['no-data'],
    };
    expect(() => {
      resolveBinding(narrow, BINDING, {});
    }).toThrow(/does not declare/);
  });
});

describe('orderRows', () => {
  const rows = [
    { window_end: '2026-01-01T00:02:00+00:00' },
    { window_end: '2026-01-01T00:05:00+00:00' },
    { window_end: '2026-01-01T00:03:00+00:00' },
  ];

  it('orders descending when the binding declares descending', () => {
    expect(orderRows(rows, BINDING).map((row) => row.window_end)).toStrictEqual([
      '2026-01-01T00:05:00+00:00',
      '2026-01-01T00:03:00+00:00',
      '2026-01-01T00:02:00+00:00',
    ]);
  });

  it('orders ascending when the binding declares ascending', () => {
    const ascending: ModelDataBindingContract = { ...BINDING, ordering_direction: 'ascending' };
    expect(orderRows(rows, ascending).map((row) => row.window_end)).toStrictEqual([
      '2026-01-01T00:02:00+00:00',
      '2026-01-01T00:03:00+00:00',
      '2026-01-01T00:05:00+00:00',
    ]);
  });

  it('orders numbers numerically, not lexicographically', () => {
    const numeric: ModelDataBindingContract = {
      ...BINDING,
      ordering_authority_field: 'seq',
      ordering_direction: 'ascending',
    };
    const numericRows = [{ seq: 100 }, { seq: 9 }, { seq: 20 }];
    expect(orderRows(numericRows, numeric).map((row) => row.seq)).toStrictEqual([9, 20, 100]);
  });

  it('refuses a mixed ordering authority rather than inventing a comparison', () => {
    const mixed = [{ window_end: '2026-01-01T00:02:00+00:00' }, { window_end: 5 }];
    expect(() => orderRows(mixed, BINDING)).toThrow(/ordering nobody declared/);
  });
});

describe('requireBinding', () => {
  it('finds a declared binding', () => {
    expect(requireBinding(COMPONENT, 'flow.one').projection_topic).toBe(TOPIC);
  });

  it('throws for a binding the component does not declare', () => {
    expect(() => requireBinding(COMPONENT, 'flow.absent')).toThrow(/declares no binding/);
  });
});
