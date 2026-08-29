// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The sealed widget envelopes, and the host that feeds them (OMN-16935).
 *
 * Two kinds of thing live here and the boundary between them is the whole
 * point of Phase 1B.
 *
 * **The envelopes** are captures: sealed by `omnibase_core`'s own
 * `seal_widget_envelope` (see `scripts/capture_widget_envelopes.py`) and
 * accepted here through the same verification path a real consumer would use.
 * Nothing loads unless its seal holds.
 *
 * **The host** is `consumerFlowDatasets()` and friends. In production this is
 * an application performing reads; here it is a function slicing a captured
 * projection response. Either way it is the *host*, never the component — that
 * separation is gate G1B.1, and putting the fixture host in `fixtures/` rather
 * than in `components/` is what keeps it honest.
 */

import { acceptEnvelopeNode, parseJsonSource, type JsonSourceValue } from '../binding/index.js';
import type { BoundDataset, HostDatasets, ProjectionRow } from '../binding/index.js';
import type { ModelWidgetEnvelope } from '../generated/onex-models.js';

import backlogSource from './widgets/consumer-flow-backlog.envelope.json?raw';
import throughputSource from './widgets/consumer-flow-throughput.envelope.json?raw';
import boardSource from './widgets/system-health-board.envelope.json?raw';
import crossSection from './projections/consumer-flow.v1.response.json' with { type: 'json' };
import windowSeries from './projections/consumer-flow.v1.window-series.response.json' with { type: 'json' };

/** The topic every fixture binding in this file reads. */
export const CONSUMER_FLOW_TOPIC = 'onex.snapshot.projection.consumer-flow.v1';

/**
 * Load one capture file and accept the envelope inside it.
 *
 * The capture wraps the envelope beside a note about how it was made, so the
 * subtree is handed to `acceptEnvelopeNode` with its number literals intact —
 * re-serialising it first would destroy exactly the evidence the seal is over.
 *
 * @param source - The capture document's text.
 * @returns The verified envelope.
 * @throws {Error} If the capture is malformed or the seal does not hold.
 */
function loadCapturedEnvelope(source: string): ModelWidgetEnvelope {
  const document = parseJsonSource(source);
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    throw new TypeError('widget capture: expected a JSON object');
  }
  const envelope = (document as Record<string, JsonSourceValue>).envelope;
  if (envelope === undefined) {
    throw new TypeError("widget capture: no 'envelope' key");
  }
  return acceptEnvelopeNode(envelope);
}

/** The D4 system-health board: a `StatusGrid` over consumer-flow severity. */
export const SYSTEM_HEALTH_BOARD: ModelWidgetEnvelope = loadCapturedEnvelope(boardSource);

/** A `TrendChart` over one consumer group's throughput window series. */
export const CONSUMER_FLOW_THROUGHPUT: ModelWidgetEnvelope =
  loadCapturedEnvelope(throughputSource);

/** A `MetricCluster`: intake per bound consumer group. */
export const CONSUMER_FLOW_BACKLOG: ModelWidgetEnvelope = loadCapturedEnvelope(backlogSource);

/** Every captured envelope, for tests that must cover all of them. */
export const WIDGET_ENVELOPES: readonly ModelWidgetEnvelope[] = [
  SYSTEM_HEALTH_BOARD,
  CONSUMER_FLOW_THROUGHPUT,
  CONSUMER_FLOW_BACKLOG,
];

/** The capture sources, for the test that re-derives each seal. */
export const WIDGET_ENVELOPE_SOURCES: Readonly<Record<string, string>> = {
  'system-health-board': boardSource,
  'consumer-flow-throughput': throughputSource,
  'consumer-flow-backlog': backlogSource,
};

/**
 * Which consumer group each board/cluster binding reads.
 *
 * A real host derives this from whatever addressing its reads use; the mapping
 * is host knowledge either way, which is why it lives here and not in a
 * component. `chain.liveness` is deliberately absent — its projection does not
 * exist yet (OMN-16779), and a binding with no read is the case G1B.2 requires
 * to render a declared empty state rather than a healthy tile.
 */
const BINDING_CONSUMER_GROUPS: Readonly<Record<string, string>> = {
  'flow.projection-event-chain': 'local.omnimarket.projection_event_chain.consume.1.0.0',
  'flow.gateway-link-health':
    'local.omnibase_infra.gateway_link_health_projection_compute.consume.1.0.0',
  'flow.gateway-forwarder': 'local.omnibase_infra.gateway_forwarder.inbound.1.0.0',
  'flow.version-skew-detector': 'local.omnimarket.version_skew_detector.consume.1.0.0',
  'flow.ticket-pipeline': 'local.omnimarket.ticket_pipeline.consume.1.0.0',
};

const CROSS_SECTION_ROWS = crossSection.rows as readonly ProjectionRow[];
const WINDOW_SERIES_ROWS = windowSeries.rows as readonly ProjectionRow[];

/**
 * Play the host for the consumer-flow board and cluster.
 *
 * One dataset per binding, each carrying the single row for that binding's
 * consumer group — the shape a host produces when it reads per binding rather
 * than fetching one blob and letting components sift it.
 *
 * @param options - `omit` drops bindings, to exercise a missing read.
 * @returns Datasets keyed by `binding_id`.
 */
export function consumerFlowDatasets(
  options: { readonly omit?: readonly string[] } = {},
): HostDatasets {
  const omit = new Set(options.omit ?? []);
  const datasets: Record<string, BoundDataset> = {};
  for (const [bindingId, group] of Object.entries(BINDING_CONSUMER_GROUPS)) {
    if (omit.has(bindingId)) {
      continue;
    }
    datasets[bindingId] = {
      projection_topic: CONSUMER_FLOW_TOPIC,
      rows: CROSS_SECTION_ROWS.filter((row) => row.consumer_group === group),
    };
  }
  return datasets;
}

/**
 * Play the host for the throughput trend.
 *
 * @returns A single dataset for the `throughput` binding.
 */
export function throughputDatasets(): HostDatasets {
  return {
    throughput: { projection_topic: CONSUMER_FLOW_TOPIC, rows: WINDOW_SERIES_ROWS },
  };
}
