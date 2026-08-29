// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `TrendChart` — the generic chart type (OMN-16937, Phase 1B.3).
 *
 * Parameterised by `ModelWidgetConfigChart`: series with data keys, axes, a
 * legend, and an ordering authority that comes from the binding rather than
 * from this file. Plan §2.2 names this the highest-duplication shape in
 * omnidash — 3,996 LOC of cost-trend forks — and the type Phase 3's migration
 * #1 lands on. Phase 1B builds the type. It does not attempt the absorption;
 * that is Phase 3 and has its own gate.
 *
 * **The three rules that make this a truth surface rather than a picture:**
 *
 * 1. **A `null` is a gap in the line, not a zero.** OMN-16777 AC5 says `null`
 *    marks a window that was never observed. Drawing it at zero shows a
 *    throughput collapse that did not happen — a *worse* lie than showing
 *    nothing, because it invents an incident. The line breaks and the gap is
 *    visible.
 * 2. **A row missing a declared series key is a typed empty state,** not a
 *    silently dropped point. A chart that quietly renders four of five series
 *    looks complete.
 * 3. **Row order comes from the binding's declared ordering authority.** The
 *    client never invents an order (`ModelDataBindingContract`'s own docstring:
 *    "no client-side ordering repair").
 *
 * **On series colour, which is a finding rather than a preference.**
 * `ModelChartSeriesConfig.color` is documented "Series color (hex)" and is
 * enforced by a hex-format validator upstream, so a config can pin a hue and
 * *cannot* name a theme token. That inverts the theme contract's own rule. This
 * component therefore reads the field as a **theme token name** and fails
 * closed on a literal, and resolves an unset colour from a declared token cycle
 * — so no chart this library draws can hold a colour the theme cannot move.
 * The upstream field is recorded as a residual on OMN-16937.
 */

import type { ReactNode } from 'react';

import { resolveBinding, type ProjectionRow } from '../binding/index.js';
import type {
  ModelChartSeriesConfig,
  ModelWidgetConfigChart,
  ModelWidgetEnvelope,
} from '../generated/onex-models.js';
import type { HostDatasets } from '../binding/index.js';
import { tokenRef } from '../theme/css-variables.js';

import { EmptyState } from './EmptyState.js';

/**
 * Theme tokens series are drawn from, in order, when a config names none.
 *
 * A declared cycle rather than a random palette: two charts showing the same
 * two series pick the same two tokens, which is what makes a dashboard read as
 * one system rather than as a collection of pages.
 */
const SERIES_TOKEN_CYCLE: readonly string[] = [
  'color_accent_primary',
  'color_accent_secondary',
  'color_status_info',
  'color_status_success',
  'color_status_warning',
];

/** Anything that pins a colour instead of naming one. */
const COLOUR_LITERAL = /^(#|rgba?\(|hsla?\(|oklch\(|lab\(|lch\()/i;

/** The drawing surface, in SVG user units. Geometry, not design tokens. */
const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 240;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 12;
const GRID_LINES = 4;

export interface TrendChartProps {
  /** A verified envelope whose `config_kind` is `chart`. */
  readonly envelope: ModelWidgetEnvelope;
  /** What the host read for each declared binding, keyed by `binding_id`. */
  readonly datasets: HostDatasets;
}

/**
 * Resolve a series' colour to a theme reference.
 *
 * @param series - The series config.
 * @param index - Its position, for the default cycle.
 * @returns A `var(--onex-*)` reference.
 * @throws {Error} If the config pins a colour literal.
 */
function seriesColour(series: ModelChartSeriesConfig, index: number): string {
  const declared = series.color;
  if (declared === null || declared === undefined || declared.length === 0) {
    const token = SERIES_TOKEN_CYCLE[index % SERIES_TOKEN_CYCLE.length];
    if (token === undefined) {
      throw new Error('series token cycle is empty');
    }
    return tokenRef(token);
  }
  if (COLOUR_LITERAL.test(declared)) {
    throw new Error(
      `series '${series.name}' pins the colour literal '${declared}'. omniui reads ` +
        'ModelChartSeriesConfig.color as a theme token NAME, because a colour in a ' +
        'config is a colour the theme cannot move — the drift the token pipeline ' +
        'exists to prevent. (The upstream field is validated as hex; that is a ' +
        'recorded residual against omnibase_core, not a licence to render it.)',
    );
  }
  return tokenRef(declared);
}

/** One point on a series: an x slot and a value, or a hole. */
interface SeriesPoint {
  readonly x: number;
  readonly value: number | null;
}

/**
 * Read one series out of the resolved rows.
 *
 * @param rows - Rows in the binding's declared order.
 * @param dataKey - The config's declared key.
 * @returns The points, or `null` when a row lacks the key entirely.
 */
function readSeries(rows: readonly ProjectionRow[], dataKey: string): SeriesPoint[] | null {
  const points: SeriesPoint[] = [];
  for (const [index, row] of rows.entries()) {
    if (!(dataKey in row)) {
      return null;
    }
    const raw = row[dataKey];
    if (raw === null || raw === undefined) {
      // Rule 1. An unobserved window is a hole, and it stays a hole.
      points.push({ x: index, value: null });
      continue;
    }
    if (typeof raw !== 'number') {
      return null;
    }
    points.push({ x: index, value: raw });
  }
  return points;
}

/**
 * Split points into the runs a polyline can actually draw.
 *
 * @param points - The series points.
 * @returns Runs of consecutive observed points.
 */
function observedRuns(points: readonly SeriesPoint[]): SeriesPoint[][] {
  const runs: SeriesPoint[][] = [];
  let current: SeriesPoint[] = [];
  for (const point of points) {
    if (point.value === null) {
      if (current.length > 0) {
        runs.push(current);
        current = [];
      }
      continue;
    }
    current.push(point);
  }
  if (current.length > 0) {
    runs.push(current);
  }
  return runs;
}

/**
 * Render a trend chart from a widget envelope and the host's reads.
 *
 * @param props - The envelope and the host-supplied datasets.
 * @returns The rendered chart.
 * @throws {TypeError} If the envelope is not a chart.
 * @throws {Error} If the chart declares no binding, or a series pins a colour.
 */
export function TrendChart({ envelope, datasets }: TrendChartProps): ReactNode {
  const config = envelope.config as ModelWidgetConfigChart;
  if (config.config_kind !== 'chart') {
    throw new TypeError(
      `TrendChart received a '${String(config.config_kind)}' config. The renderer ` +
        'gates on the declared kind rather than duck-typing the config.',
    );
  }

  const binding = (envelope.component.data_bindings ?? [])[0];
  if (binding === undefined) {
    throw new Error(
      `chart widget '${envelope.widget_id}' declares no data binding. A chart with ` +
        'no declared read has nothing to be current about.',
    );
  }

  const resolution = resolveBinding(envelope.component, binding, datasets);
  if (resolution.status === 'empty') {
    return <EmptyState reason={resolution.reason} detail={resolution.detail} />;
  }

  const series = config.series ?? [];
  if (series.length === 0) {
    return (
      <EmptyState
        reason="no-data"
        detail={`widget '${envelope.widget_id}' declares no chart series`}
      />
    );
  }

  const read = series.map((entry) => ({
    config: entry,
    points: readSeries(resolution.rows, entry.data_key),
  }));

  // Rule 2. A missing key is stated, not skipped.
  const absent = read.find((entry) => entry.points === null);
  if (absent !== undefined) {
    return (
      <EmptyState
        reason="missing-field"
        detail={
          `series '${absent.config.name}' reads '${absent.config.data_key}', which ` +
          `topic '${binding.projection_topic}' did not deliver as a number in every row`
        }
      />
    );
  }

  const values = read.flatMap((entry) =>
    (entry.points ?? []).flatMap((point) => (point.value === null ? [] : [point.value])),
  );
  if (values.length === 0) {
    return (
      <EmptyState
        reason="no-data"
        detail={
          `topic '${binding.projection_topic}' returned ${String(resolution.rows.length)} ` +
          'row(s), none of which carried an observed value for any declared series'
        }
      />
    );
  }

  const declaredMin = config.y_axis?.min_value;
  const declaredMax = config.y_axis?.max_value;
  const low = declaredMin ?? Math.min(...values, 0);
  const high = declaredMax ?? Math.max(...values);
  const span = high - low === 0 ? 1 : high - low;
  const slots = resolution.rows.length === 1 ? 1 : resolution.rows.length - 1;

  /**
   * Project a point into the drawing surface.
   *
   * @param point - The point.
   * @returns Its SVG coordinates.
   */
  const project = (point: SeriesPoint): { x: number; y: number } => ({
    x: PAD_LEFT + (point.x / slots) * (VIEW_WIDTH - PAD_LEFT - PAD_RIGHT),
    y:
      VIEW_HEIGHT -
      PAD_BOTTOM -
      (((point.value ?? 0) - low) / span) * (VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM),
  });

  const gapCount = read.reduce(
    (total, entry) => total + (entry.points ?? []).filter((point) => point.value === null).length,
    0,
  );

  return (
    <figure
      data-onex-widget={envelope.widget_id}
      data-onex-component-kind="chart"
      style={{
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: tokenRef('spacing_sm'),
        padding: tokenRef('spacing_md'),
        borderRadius: tokenRef('border_radius_md'),
        border: `1px solid ${tokenRef('color_border_default')}`,
        backgroundColor: tokenRef('color_background_secondary'),
        fontFamily: tokenRef('font_family_base'),
        color: tokenRef('color_text_primary'),
      }}
    >
      <figcaption
        style={{ fontSize: tokenRef('font_size_md'), fontWeight: tokenRef('font_weight_bold') }}
      >
        {envelope.component.title}
      </figcaption>

      {config.show_legend ?? true ? (
        <div
          data-onex-legend
          style={{ display: 'flex', flexWrap: 'wrap', gap: tokenRef('spacing_md') }}
        >
          {read.map((entry, index) => (
            <span
              key={entry.config.data_key}
              data-onex-legend-entry={entry.config.data_key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: tokenRef('spacing_xs'),
                fontSize: tokenRef('font_size_sm'),
                color: tokenRef('color_text_secondary'),
              }}
            >
              <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
                <line
                  x1={1}
                  y1={7}
                  x2={13}
                  y2={7}
                  stroke={seriesColour(entry.config, index)}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </svg>
              {entry.config.name}
            </span>
          ))}
        </div>
      ) : null}

      <svg
        role="img"
        aria-label={`${envelope.component.title}: ${String(series.length)} series over ${String(resolution.rows.length)} points`}
        viewBox={`0 0 ${String(VIEW_WIDTH)} ${String(VIEW_HEIGHT)}`}
        width="100%"
        preserveAspectRatio="none"
        style={{ display: 'block', height: '14rem' }}
      >
        {config.y_axis?.show_grid ?? false
          ? Array.from({ length: GRID_LINES + 1 }, (_unused, index) => {
              const y = PAD_TOP + (index / GRID_LINES) * (VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM);
              return (
                <line
                  key={index}
                  x1={PAD_LEFT}
                  y1={y}
                  x2={VIEW_WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke={tokenRef('color_border_default')}
                  strokeWidth={1}
                />
              );
            })
          : null}

        {read.map((entry, index) => (
          <g key={entry.config.data_key} data-onex-series={entry.config.data_key}>
            {observedRuns(entry.points ?? []).map((run) => (
              <polyline
                key={`${entry.config.data_key}-${String(run[0]?.x ?? 0)}`}
                data-onex-series-run
                fill="none"
                stroke={seriesColour(entry.config, index)}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={run
                  .map((point) => {
                    const { x, y } = project(point);
                    return `${x.toFixed(2)},${y.toFixed(2)}`;
                  })
                  .join(' ')}
              />
            ))}
          </g>
        ))}
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: tokenRef('font_size_sm'),
          color: tokenRef('color_text_secondary'),
        }}
      >
        <span data-onex-axis-label="x">{config.x_axis?.label ?? binding.ordering_authority_field}</span>
        {gapCount > 0 ? (
          // Rule 1, said out loud. A break in a line is easy to miss and easy
          // to misread as a rendering artefact; naming it makes the gap a fact
          // the chart is reporting rather than one the reader has to infer.
          <span data-onex-series-gaps={String(gapCount)}>
            {gapCount} unobserved point{gapCount === 1 ? '' : 's'} — not drawn as zero
          </span>
        ) : null}
        <span data-onex-axis-label="y">{config.y_axis?.label ?? ''}</span>
      </div>
    </figure>
  );
}
