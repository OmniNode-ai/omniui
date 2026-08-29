// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * TrendChart: the null is a gap, and everything else follows (OMN-16937).
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { HostDatasets } from '../binding/index.js';
import { fixtureTheme } from '../fixtures/index.js';
import { CONSUMER_FLOW_THROUGHPUT, throughputDatasets } from '../fixtures/widgets.js';
import type { ModelWidgetConfigChart, ModelWidgetEnvelope } from '../generated/onex-models.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';

import { TrendChart } from './TrendChart.js';

const TOPIC = 'onex.snapshot.projection.consumer-flow.v1';

/**
 * Render the chart under a theme.
 *
 * @param datasets - What the host delivered.
 * @param envelope - Which envelope to render.
 * @returns The container.
 */
function renderChart(
  datasets: HostDatasets = throughputDatasets(),
  envelope: ModelWidgetEnvelope = CONSUMER_FLOW_THROUGHPUT,
): HTMLElement {
  const { container } = render(
    <ThemeProvider theme={fixtureTheme('onex.theme.dark')}>
      <TrendChart envelope={envelope} datasets={datasets} />
    </ThemeProvider>,
  );
  return container;
}

/**
 * Every polyline drawn for one series.
 *
 * @param container - The rendered container.
 * @param dataKey - The series key.
 * @returns The run elements.
 */
function runs(container: HTMLElement, dataKey: string): Element[] {
  return [
    ...container.querySelectorAll(`[data-onex-series="${dataKey}"] [data-onex-series-run]`),
  ];
}

describe('TrendChart', () => {
  it('renders from the envelope alone, one group per declared series', () => {
    const container = renderChart();
    const config = CONSUMER_FLOW_THROUGHPUT.config as ModelWidgetConfigChart;
    expect(container.querySelectorAll('[data-onex-series]')).toHaveLength(
      (config.series ?? []).length,
    );
    expect(container.querySelector('[data-onex-widget]')?.getAttribute('data-onex-widget')).toBe(
      'onex.widget.consumer_flow_throughput',
    );
  });

  it('breaks the line at an unobserved window instead of drawing it at zero', () => {
    // The window series carries one all-null window (2026-01-01T00:03:00Z).
    // Drawing it as zero would show a throughput collapse that did not happen.
    const container = renderChart();
    expect(runs(container, 'messages_in')).toHaveLength(2);
    expect(runs(container, 'messages_out')).toHaveLength(2);
  });

  it('says how many points were unobserved rather than leaving the gap to be inferred', () => {
    const container = renderChart();
    const note = container.querySelector('[data-onex-series-gaps]');
    expect(note?.getAttribute('data-onex-series-gaps')).toBe('2');
    expect(note?.textContent).toContain('not drawn as zero');
  });

  it('draws a continuous line when nothing is unobserved', () => {
    const rows = (throughputDatasets().throughput?.rows ?? []).filter(
      (row) => row.messages_in !== null,
    );
    const container = renderChart({ throughput: { projection_topic: TOPIC, rows } });
    expect(runs(container, 'messages_in')).toHaveLength(1);
    expect(container.querySelector('[data-onex-series-gaps]')).toBeNull();
  });

  it('orders points by the binding-declared ordering authority, not by delivery order', () => {
    // The binding declares window_end ASCENDING. The capture is DESCENDING, so
    // an unordered renderer draws the series backwards: messages_in climbs from
    // 1837 to 15750, and a reversed chart shows a recovery instead of a stall.
    const container = renderChart();
    const first = runs(container, 'messages_in')[0]?.getAttribute('points') ?? '';
    const ys = first.split(' ').map((pair) => Number(pair.split(',')[1]));
    // Ascending values project to descending y (SVG y grows downward).
    expect(ys.length).toBeGreaterThan(1);
    for (let i = 1; i < ys.length; i += 1) {
      expect(Number(ys[i])).toBeLessThanOrEqual(Number(ys[i - 1]));
    }
  });

  it('reports a missing series key as a typed empty state, not a dropped series', () => {
    const rows = (throughputDatasets().throughput?.rows ?? []).map((row) => {
      const { messages_out: _dropped, ...rest } = row;
      return rest;
    });
    const container = renderChart({ throughput: { projection_topic: TOPIC, rows } });
    expect(
      container
        .querySelector('[data-onex-empty-reason]')
        ?.getAttribute('data-onex-empty-reason'),
    ).toBe('missing-field');
    expect(container.querySelector('[data-onex-empty-detail]')?.textContent).toContain(
      'messages_out',
    );
  });

  it('reports a read that never happened, distinct from one that returned nothing', () => {
    expect(
      renderChart({})
        .querySelector('[data-onex-empty-reason]')
        ?.getAttribute('data-onex-empty-reason'),
    ).toBe('upstream-blocked');
    expect(
      renderChart({ throughput: { projection_topic: TOPIC, rows: [] } })
        .querySelector('[data-onex-empty-reason]')
        ?.getAttribute('data-onex-empty-reason'),
    ).toBe('no-data');
  });

  it('reports a window of nothing but unobserved points as no-data, never as a flat line', () => {
    const rows = (throughputDatasets().throughput?.rows ?? []).map((row) => ({
      ...row,
      messages_in: null,
      messages_out: null,
    }));
    const container = renderChart({ throughput: { projection_topic: TOPIC, rows } });
    expect(
      container
        .querySelector('[data-onex-empty-reason]')
        ?.getAttribute('data-onex-empty-reason'),
    ).toBe('no-data');
    expect(container.querySelector('[data-onex-series-run]')).toBeNull();
  });

  it('pins no colour — series paint resolves through a theme token', () => {
    const container = renderChart();
    for (const run of container.querySelectorAll('[data-onex-series-run]')) {
      expect(run.getAttribute('stroke')).toMatch(/^var\(--onex-color-/);
    }
    const widget = container.querySelector<HTMLElement>('[data-onex-widget]');
    for (const element of widget?.querySelectorAll<HTMLElement>('[style]') ?? []) {
      expect(element.getAttribute('style') ?? '').not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });

  it('reads a declared series colour as a theme token NAME', () => {
    const config = CONSUMER_FLOW_THROUGHPUT.config as ModelWidgetConfigChart;
    const tokened = {
      ...CONSUMER_FLOW_THROUGHPUT,
      config: {
        ...config,
        series: (config.series ?? []).map((entry) => ({ ...entry, color: 'color_status_error' })),
      },
    } as ModelWidgetEnvelope;
    const container = renderChart(throughputDatasets(), tokened);
    expect(container.querySelector('[data-onex-series-run]')?.getAttribute('stroke')).toBe(
      'var(--onex-color-status-error)',
    );
  });

  it('fails closed on a config that pins a colour literal', () => {
    // The upstream field is validated as hex, which is the residual this test
    // pins: omniui refuses to render a hue a config chose, because the theme
    // could never move it.
    const config = CONSUMER_FLOW_THROUGHPUT.config as ModelWidgetConfigChart;
    const pinned = {
      ...CONSUMER_FLOW_THROUGHPUT,
      config: {
        ...config,
        // onex-token-exempt: this literal is the SUBJECT of the test — the
        // component must refuse it. Writing it as a token would test nothing.
        series: (config.series ?? []).map((entry) => ({ ...entry, color: '#ef4444' })),
      },
    } as ModelWidgetEnvelope;
    expect(() => renderChart(throughputDatasets(), pinned)).toThrow(/pins the colour literal/);
  });

  it('refuses an envelope that is not a chart', () => {
    const wrong = {
      ...CONSUMER_FLOW_THROUGHPUT,
      config: { ...CONSUMER_FLOW_THROUGHPUT.config, config_kind: 'status_grid' },
    } as ModelWidgetEnvelope;
    expect(() => renderChart(throughputDatasets(), wrong)).toThrow(
      /received a 'status_grid' config/,
    );
  });

  it('labels its axes from the config, falling back to the declared ordering authority', () => {
    const container = renderChart();
    expect(container.querySelector('[data-onex-axis-label="x"]')?.textContent).toBe('Window end');
    expect(container.querySelector('[data-onex-axis-label="y"]')?.textContent).toBe('Messages');
  });

  it('names both series in a legend', () => {
    const container = renderChart();
    expect(container.querySelectorAll('[data-onex-legend-entry]')).toHaveLength(2);
    expect(container.querySelector('[data-onex-legend]')?.textContent).toContain('Messages in');
  });
});
