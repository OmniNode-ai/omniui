// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `MetricCluster` — the generic KPI type (OMN-16938, Phase 1B.4).
 *
 * Parameterised by `ModelWidgetConfigMetricCard`: one metric key, one label,
 * one format. The **cluster** is the set of declared bindings — the same KPI
 * read from several sources, one card each — rather than a hand-assembled list
 * of differently-configured cards. That is what makes it a generic type: two
 * dashboards showing "messages in per consumer group" and "queue depth per
 * broker" are the same component with different envelopes, not two components.
 *
 * Card identity comes from `binding_id`, exactly as it does on `StatusGrid`.
 * The alternative — a "group by" key naming a row column — is not in the
 * contract, and inventing one in a component is how the next widget ends up
 * needing its own bespoke config.
 *
 * **An absent number is "No reading", never `0` and never a blank cell.** Third
 * application of OMN-16777 AC5 in this phase, for the same reason each time: a
 * window that was never observed is a different fact from a window observed to
 * have carried nothing, and a KPI that shows `0` for both is a KPI that reports
 * a healthy idle system and a dead pipeline identically.
 */

import type { ReactNode } from 'react';

import { resolveBinding, type HostDatasets } from '../binding/index.js';
import type {
  ModelDataBindingContract,
  ModelWidgetConfigMetricCard,
  ModelWidgetEnvelope,
} from '../generated/onex-models.js';
import { tokenRef } from '../theme/css-variables.js';

import { EmptyState } from './EmptyState.js';
import { Icon } from './Icon.js';

export interface MetricClusterProps {
  /** A verified envelope whose `config_kind` is `metric_card`. */
  readonly envelope: ModelWidgetEnvelope;
  /** What the host read for each declared binding, keyed by `binding_id`. */
  readonly datasets: HostDatasets;
}

/** Which way a trend moved, without saying whether that is good. */
type TrendDirection = 'up' | 'down' | 'flat' | 'unknown';

/**
 * Format a measured value the way the config asks.
 *
 * @param value - The measured value.
 * @param config - The metric config.
 * @returns The formatted number.
 */
function formatValue(value: number, config: ModelWidgetConfigMetricCard): string {
  const precision = config.precision ?? 0;
  const format = config.format ?? 'number';
  switch (format) {
    case 'currency':
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
    case 'percent':
      return `${value.toFixed(precision)}%`;
    case 'duration':
      return `${value.toFixed(precision)} ms`;
    case 'number':
    default:
      return value.toLocaleString('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
  }
}

/** How a trend renders: a glyph that is a shape, and a word. */
const TREND_PRESENTATION: Readonly<
  Record<TrendDirection, { readonly icon: string; readonly label: string }>
> = {
  up: { icon: 'trend-up', label: 'above comparison' },
  down: { icon: 'trend-down', label: 'below comparison' },
  flat: { icon: 'trend-flat', label: 'level with comparison' },
  unknown: { icon: 'question-diamond', label: 'no comparison reading' },
};

/**
 * Read a numeric cell without inventing one.
 *
 * @param row - The projection row.
 * @param key - The column to read.
 * @returns The number, or `null` when the cell is absent or unobserved.
 */
function readNumber(row: Readonly<Record<string, unknown>>, key: string): number | null {
  const raw = row[key];
  return typeof raw === 'number' ? raw : null;
}

/**
 * One card: a source, a number, and how it compares.
 *
 * @param props - The binding, the config, and the host's reads.
 * @returns The rendered card.
 */
function MetricCard({
  binding,
  config,
  envelope,
  datasets,
}: {
  readonly binding: ModelDataBindingContract;
  readonly config: ModelWidgetConfigMetricCard;
  readonly envelope: ModelWidgetEnvelope;
  readonly datasets: HostDatasets;
}): ReactNode {
  const frame = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokenRef('spacing_xs'),
    padding: tokenRef('spacing_md'),
    borderRadius: tokenRef('border_radius_md'),
    border: `1px solid ${tokenRef('color_border_default')}`,
    backgroundColor: tokenRef('color_background_secondary'),
    fontFamily: tokenRef('font_family_base'),
  };

  const caption = (
    <span
      data-onex-card-source
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokenRef('spacing_xs'),
        color: tokenRef('color_text_secondary'),
        fontSize: tokenRef('font_size_sm'),
      }}
    >
      {config.icon === null || config.icon === undefined ? null : <Icon name={config.icon} />}
      {binding.binding_id}
    </span>
  );

  const resolution = resolveBinding(envelope.component, binding, datasets);
  if (resolution.status === 'empty') {
    return (
      <div data-onex-card={binding.binding_id} data-onex-card-state="empty" style={frame}>
        {caption}
        <EmptyState reason={resolution.reason} detail={resolution.detail} compact />
      </div>
    );
  }

  // The binding's ordering authority puts the row this card reports first.
  const row = resolution.rows[0];
  if (row === undefined) {
    // resolveBinding rejects an empty row set, so reaching here would mean the
    // seam changed underneath this component. Fail rather than render a card
    // with nothing in it.
    throw new Error(`binding '${binding.binding_id}' resolved with no rows`);
  }

  const value = readNumber(row, config.metric_key);
  const showTrend = config.show_trend ?? false;
  const trendKey = config.trend_key;
  const comparison = showTrend && trendKey !== null && trendKey !== undefined
    ? readNumber(row, trendKey)
    : null;

  let direction: TrendDirection = 'unknown';
  if (value !== null && comparison !== null) {
    direction = value > comparison ? 'up' : value < comparison ? 'down' : 'flat';
  }
  const trend = TREND_PRESENTATION[direction];

  return (
    <div
      data-onex-card={binding.binding_id}
      data-onex-card-state="resolved"
      data-onex-metric-reading={value === null ? 'none' : 'observed'}
      style={frame}
    >
      {caption}
      <span
        data-onex-card-label
        style={{ color: tokenRef('color_text_secondary'), fontSize: tokenRef('font_size_sm') }}
      >
        {config.label}
      </span>
      {value === null ? (
        <span
          data-onex-card-value="none"
          style={{ color: tokenRef('color_text_disabled'), fontSize: tokenRef('font_size_lg') }}
        >
          No reading
        </span>
      ) : (
        <span
          data-onex-card-value="observed"
          style={{
            color: tokenRef('color_text_primary'),
            fontSize: tokenRef('font_size_lg'),
            fontWeight: tokenRef('font_weight_bold'),
          }}
        >
          {formatValue(value, config)}
          {config.unit === null || config.unit === undefined ? null : (
            <span data-onex-card-unit style={{ fontSize: tokenRef('font_size_sm') }}>
              {' '}
              {config.unit}
            </span>
          )}
        </span>
      )}
      {showTrend ? (
        <span
          data-onex-card-trend={direction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: tokenRef('spacing_xs'),
            color: tokenRef('color_text_secondary'),
            fontSize: tokenRef('font_size_sm'),
          }}
        >
          <Icon name={trend.icon} title={trend.label} size={14} />
          <span data-onex-card-trend-label>{trend.label}</span>
          {comparison === null ? null : (
            <span data-onex-card-trend-value>{formatValue(comparison, config)}</span>
          )}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Render a KPI cluster from a widget envelope and the host's reads.
 *
 * @param props - The envelope and the host-supplied datasets.
 * @returns The rendered cluster.
 * @throws {TypeError} If the envelope is not a metric card.
 * @throws {Error} If the config asks for a trend without naming a comparison,
 *   or if the widget declares no bindings.
 */
export function MetricCluster({ envelope, datasets }: MetricClusterProps): ReactNode {
  const config = envelope.config as ModelWidgetConfigMetricCard;
  if (config.config_kind !== 'metric_card') {
    throw new TypeError(
      `MetricCluster received a '${String(config.config_kind)}' config. The renderer ` +
        'gates on the declared kind rather than duck-typing the config.',
    );
  }

  // The core model raises the same error on construction. An envelope that
  // arrived over a wire never went through that constructor, and a trend
  // indicator with nothing to compare against would render a direction it made
  // up — so the consumer enforces the rule too.
  if ((config.show_trend ?? false) && (config.trend_key === null || config.trend_key === undefined)) {
    throw new Error(
      `widget '${envelope.widget_id}' sets show_trend without a trend_key. A trend ` +
        'with no declared comparison is a direction the renderer would have to invent.',
    );
  }

  // `ModelMetricThreshold.color` carries a raw colour upstream, the same defect
  // `ModelChartSeriesConfig.color` has (see OMN-16937). Rather than render a
  // hue a config chose, thresholds are refused outright until the upstream
  // field names a theme token. Silently ignoring them would be worse: the
  // config would say the value is coloured by threshold and it would not be.
  if ((config.thresholds ?? []).length > 0) {
    throw new Error(
      `widget '${envelope.widget_id}' declares metric thresholds, whose 'color' field ` +
        'carries a colour VALUE upstream rather than a theme token name. omniui will ' +
        'not render a colour a config pinned, and will not silently drop a declared ' +
        'threshold either. Recorded as a residual against omnibase_core (OMN-16937).',
    );
  }

  const bindings = envelope.component.data_bindings ?? [];
  if (bindings.length === 0) {
    return (
      <EmptyState
        reason="no-data"
        detail={`widget '${envelope.widget_id}' declares no data bindings`}
      />
    );
  }

  return (
    <div
      data-onex-widget={envelope.widget_id}
      data-onex-component-kind="metric_card"
      role="group"
      aria-label={envelope.component.title}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
        gap: tokenRef('spacing_md'),
      }}
    >
      {bindings.map((binding) => (
        <MetricCard
          key={binding.binding_id}
          binding={binding}
          config={config}
          envelope={envelope}
          datasets={datasets}
        />
      ))}
    </div>
  );
}
