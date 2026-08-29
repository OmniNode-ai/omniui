// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Binding resolution — the seam that makes "no component-owned fetch" a
 * mechanical fact (OMN-16935, Phase 1B.1).
 *
 * Plan §2.2's binding rule: *"a component receives its data through the widget
 * envelope's bindings — not by calling `useProjectionQuery` itself."* This
 * module is what that sentence costs in code. A **host** reads each declared
 * `ModelDataBindingContract` by whatever transport it uses and hands the
 * results in; a **component** takes what it was handed and resolves it, or
 * renders a typed empty state saying why it could not.
 *
 * **Datasets are keyed by `binding_id`, not by topic.** Three tiles on a board
 * can bind three different topics, and one of those reads can be missing while
 * the others are present. Keyed by topic, "the chain-liveness projection does
 * not exist yet" and "the consumer-flow read came back empty" would be the same
 * key with different contents; keyed by binding, they are different bindings
 * with different reasons, which is what an operator needs to see.
 *
 * **Every failure is a declared reason, never a blank.** `EnumEmptyStateReason`
 * has exactly four values and the renderer must not collapse them
 * (`schema-invalid` is not `no-data`). A reason a component's contract did not
 * declare it could surface is a programming error and throws, because the
 * alternative is a component rendering a state its contract says is impossible.
 */

import type {
  EnumEmptyStateReason,
  ModelComponentContract,
  ModelDataBindingContract,
} from '../generated/onex-models.js';

/** One projection row, exactly as the projection API returned it. */
export type ProjectionRow = Readonly<Record<string, unknown>>;

/**
 * What a host delivered for one declared binding.
 *
 * `projection_topic` is carried so the resolver can check that the host read
 * the topic the binding actually declares. A host that answers binding `a` with
 * topic `b`'s rows is a wiring bug that would otherwise render as data.
 */
export interface BoundDataset {
  readonly projection_topic: string;
  readonly rows: readonly ProjectionRow[];
}

/** Everything a host delivered, keyed by `binding_id`. */
export type HostDatasets = Readonly<Record<string, BoundDataset>>;

/** A binding that resolved, with its rows in the upstream-declared order. */
export interface ResolvedBinding {
  readonly status: 'resolved';
  readonly binding_id: string;
  readonly rows: readonly ProjectionRow[];
}

/** A binding that did not resolve, and the declared reason why. */
export interface UnresolvedBinding {
  readonly status: 'empty';
  readonly binding_id: string;
  readonly reason: EnumEmptyStateReason;
  /** Operator-facing specifics: which field, which topic, which binding. */
  readonly detail: string;
}

/** The result of resolving one binding. */
export type BindingResolution = ResolvedBinding | UnresolvedBinding;

/**
 * Order rows by the binding's declared ordering authority.
 *
 * The client never invents an order — the binding names the column the upstream
 * projection orders by, and this reproduces that order over whatever subset the
 * host delivered. Mixed value types throw rather than falling back to a string
 * comparison, because a silent lexicographic sort of numbers is an ordering
 * nobody declared.
 *
 * @param rows - Rows to order.
 * @param binding - The binding declaring the ordering authority.
 * @returns A new array in the declared order.
 * @throws {TypeError} If the ordering-authority values are not uniformly
 *   comparable strings or numbers.
 */
export function orderRows(
  rows: readonly ProjectionRow[],
  binding: ModelDataBindingContract,
): readonly ProjectionRow[] {
  const field = binding.ordering_authority_field;
  const descending = binding.ordering_direction !== 'ascending';
  const sorted = [...rows];
  sorted.sort((left, right) => {
    const a = left[field];
    const b = right[field];
    if (typeof a === 'number' && typeof b === 'number') {
      return descending ? b - a : a - b;
    }
    if (typeof a === 'string' && typeof b === 'string') {
      const cmp = a < b ? -1 : a > b ? 1 : 0;
      return descending ? -cmp : cmp;
    }
    throw new TypeError(
      `binding '${binding.binding_id}': ordering authority '${field}' holds ` +
        `${typeof a} and ${typeof b}; an ordering nobody declared is not a fallback`,
    );
  });
  return sorted;
}

/**
 * Refuse a reason the component contract never said it could surface.
 *
 * @param component - The component contract.
 * @param reason - The reason about to be surfaced.
 * @throws {Error} If the contract does not declare the reason.
 */
function assertDeclaredReason(
  component: ModelComponentContract,
  reason: EnumEmptyStateReason,
): void {
  const declared = component.supported_empty_state_reasons ?? [];
  if (!declared.includes(reason)) {
    throw new Error(
      `component '${component.component_id}' surfaced the empty-state reason ` +
        `'${reason}', which its contract does not declare ` +
        `(declared: ${declared.length === 0 ? 'none' : declared.join(', ')}). ` +
        'A component must not render a state its own contract calls impossible.',
    );
  }
}

/**
 * Resolve one declared binding against what the host delivered.
 *
 * The four failure cases are deliberately four *different* reasons, because an
 * operator acts differently on each:
 *
 * | Case | Reason | What it means |
 * |---|---|---|
 * | No dataset for this `binding_id` | `upstream-blocked` | the read never happened — the projection may not exist yet |
 * | Dataset carries a different topic | `schema-invalid` | the host wired the wrong read to this binding |
 * | Zero rows | `no-data` | the read happened and returned nothing |
 * | A declared required field absent from a row | `missing-field` | the projection's shape and the contract's disagree |
 *
 * Collapsing any two of those into one reason is the behaviour
 * `EnumEmptyStateReason`'s own docstring forbids.
 *
 * @param component - The component contract declaring the binding.
 * @param binding - The binding to resolve.
 * @param datasets - What the host delivered, keyed by `binding_id`.
 * @returns The resolved rows, or a declared empty-state reason.
 * @throws {Error} If a reason is surfaced that the contract does not declare.
 */
export function resolveBinding(
  component: ModelComponentContract,
  binding: ModelDataBindingContract,
  datasets: HostDatasets,
): BindingResolution {
  const id = binding.binding_id;

  /**
   * @param reason - The declared reason.
   * @param detail - Operator-facing specifics.
   * @returns The unresolved result.
   */
  const unresolved = (reason: EnumEmptyStateReason, detail: string): UnresolvedBinding => {
    assertDeclaredReason(component, reason);
    return { status: 'empty', binding_id: id, reason, detail };
  };

  const dataset = datasets[id];
  if (dataset === undefined) {
    return unresolved(
      'upstream-blocked',
      `the host delivered no read for binding '${id}' (topic '${binding.projection_topic}')`,
    );
  }

  if (dataset.projection_topic !== binding.projection_topic) {
    return unresolved(
      'schema-invalid',
      `binding '${id}' declares topic '${binding.projection_topic}' but the host ` +
        `delivered '${dataset.projection_topic}'`,
    );
  }

  if (dataset.rows.length === 0) {
    return unresolved('no-data', `topic '${binding.projection_topic}' returned no rows`);
  }

  // The ordering authority is a required field whether or not it is listed as
  // one: rows that cannot be ordered cannot be rendered in a declared order.
  const required = [...(binding.required_fields ?? []), binding.ordering_authority_field];
  for (const field of required) {
    const missingIn = dataset.rows.findIndex((row) => !(field in row));
    if (missingIn !== -1) {
      return unresolved(
        'missing-field',
        `row ${String(missingIn)} of topic '${binding.projection_topic}' has no ` +
          `'${field}', which binding '${id}' declares as required`,
      );
    }
  }

  return { status: 'resolved', binding_id: id, rows: orderRows(dataset.rows, binding) };
}

/**
 * Find a declared binding by id.
 *
 * @param component - The component contract.
 * @param bindingId - The binding to find.
 * @returns The binding.
 * @throws {Error} If the component declares no such binding.
 */
export function requireBinding(
  component: ModelComponentContract,
  bindingId: string,
): ModelDataBindingContract {
  const binding = (component.data_bindings ?? []).find(
    (candidate) => candidate.binding_id === bindingId,
  );
  if (binding === undefined) {
    throw new Error(
      `component '${component.component_id}' declares no binding '${bindingId}'`,
    );
  }
  return binding;
}
