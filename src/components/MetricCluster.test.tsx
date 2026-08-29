// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * MetricCluster: one card per bound source, and no invented numbers
 * (OMN-16938).
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { HostDatasets } from '../binding/index.js';
import { fixtureTheme } from '../fixtures/index.js';
import { CONSUMER_FLOW_BACKLOG, consumerFlowDatasets } from '../fixtures/widgets.js';
import type {
  ModelWidgetConfigMetricCard,
  ModelWidgetEnvelope,
} from '../generated/onex-models.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';

import { MetricCluster } from './MetricCluster.js';

const CONFIG = CONSUMER_FLOW_BACKLOG.config as ModelWidgetConfigMetricCard;

/**
 * Render the cluster under a theme.
 *
 * @param datasets - What the host delivered.
 * @param envelope - Which envelope to render.
 * @returns The container.
 */
function renderCluster(
  datasets: HostDatasets = consumerFlowDatasets(),
  envelope: ModelWidgetEnvelope = CONSUMER_FLOW_BACKLOG,
): HTMLElement {
  const { container } = render(
    <ThemeProvider theme={fixtureTheme('onex.theme.dark')}>
      <MetricCluster envelope={envelope} datasets={datasets} />
    </ThemeProvider>,
  );
  return container;
}

/**
 * Read one card.
 *
 * @param container - The rendered container.
 * @param bindingId - The card's binding.
 * @returns The card element.
 */
function card(container: HTMLElement, bindingId: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(`[data-onex-card="${bindingId}"]`);
  if (found === null) {
    throw new Error(`no card '${bindingId}' in the render`);
  }
  return found;
}

/**
 * Replace the config on the fixture envelope.
 *
 * @param patch - Config fields to override.
 * @returns An envelope carrying the patched config.
 */
function withConfig(patch: Partial<ModelWidgetConfigMetricCard>): ModelWidgetEnvelope {
  return {
    ...CONSUMER_FLOW_BACKLOG,
    config: { ...CONFIG, ...patch },
  } as ModelWidgetEnvelope;
}

describe('MetricCluster', () => {
  it('renders one card per declared binding — the cluster IS the binding set', () => {
    const container = renderCluster();
    expect(container.querySelectorAll('[data-onex-card]')).toHaveLength(
      (CONSUMER_FLOW_BACKLOG.component.data_bindings ?? []).length,
    );
  });

  it('reads the value by the config-declared metric key', () => {
    const container = renderCluster();
    expect(
      card(container, 'flow.gateway-link-health').querySelector('[data-onex-card-value]')
        ?.textContent,
    ).toContain('15,750');
  });

  it('renders an unobserved metric as "No reading", never as zero or a blank', () => {
    // OMN-16777 AC5, third application. flow.ticket-pipeline's row carries null
    // counters: the window was never observed.
    const container = renderCluster();
    const unknown = card(container, 'flow.ticket-pipeline');
    expect(unknown.getAttribute('data-onex-metric-reading')).toBe('none');
    expect(unknown.querySelector('[data-onex-card-value]')?.getAttribute('data-onex-card-value'))
      .toBe('none');
    expect(unknown.textContent).toContain('No reading');
    expect(unknown.textContent).not.toMatch(/\b0\b/);
  });

  it('keeps an observed zero as a zero', () => {
    const container = renderCluster();
    const starved = card(container, 'flow.gateway-forwarder');
    expect(starved.getAttribute('data-onex-metric-reading')).toBe('observed');
    expect(starved.querySelector('[data-onex-card-value]')?.textContent).toContain('0');
    expect(starved.textContent).not.toContain('No reading');
  });

  it('reports a trend direction as a word and a shape, not only a glyph', () => {
    const container = renderCluster();
    // 15,750 in against 0 out: above its comparison.
    const stalled = card(container, 'flow.gateway-link-health');
    expect(stalled.querySelector('[data-onex-card-trend]')?.getAttribute('data-onex-card-trend'))
      .toBe('up');
    expect(stalled.querySelector('[data-onex-card-trend-label]')?.textContent).toBe(
      'above comparison',
    );
    // 1,840 in against 1,840 out: level.
    const flowing = card(container, 'flow.projection-event-chain');
    expect(flowing.querySelector('[data-onex-card-trend]')?.getAttribute('data-onex-card-trend'))
      .toBe('flat');
  });

  it('says there is no comparison rather than showing a direction it invented', () => {
    const container = renderCluster();
    const unknown = card(container, 'flow.ticket-pipeline');
    expect(unknown.querySelector('[data-onex-card-trend]')?.getAttribute('data-onex-card-trend'))
      .toBe('unknown');
    expect(unknown.querySelector('[data-onex-card-trend-label]')?.textContent).toBe(
      'no comparison reading',
    );
  });

  it('gives every trend direction a distinct word and a distinct shape', () => {
    const container = renderCluster();
    const seen = new Map<string, { label: string; icon: string }>();
    for (const element of container.querySelectorAll<HTMLElement>('[data-onex-card-trend]')) {
      seen.set(element.getAttribute('data-onex-card-trend') ?? '', {
        label: element.querySelector('[data-onex-card-trend-label]')?.textContent ?? '',
        icon: element.querySelector('[data-onex-icon]')?.getAttribute('data-onex-icon') ?? '',
      });
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    const labels = [...seen.values()].map((entry) => entry.label);
    const icons = [...seen.values()].map((entry) => entry.icon);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('renders a card whose read never happened as a declared empty state', () => {
    const container = renderCluster(consumerFlowDatasets({ omit: ['flow.gateway-forwarder'] }));
    const missing = card(container, 'flow.gateway-forwarder');
    expect(missing.getAttribute('data-onex-card-state')).toBe('empty');
    expect(
      missing.querySelector('[data-onex-empty-reason]')?.getAttribute('data-onex-empty-reason'),
    ).toBe('upstream-blocked');
    // The other cards are unaffected: one failed read is not a failed widget.
    expect(card(container, 'flow.gateway-link-health').getAttribute('data-onex-card-state')).toBe(
      'resolved',
    );
  });

  it('refuses show_trend without a trend_key, matching the core validator', () => {
    expect(() => renderCluster(consumerFlowDatasets(), withConfig({ trend_key: null }))).toThrow(
      /show_trend without a trend_key/,
    );
  });

  it('refuses declared thresholds rather than rendering a colour a config pinned', () => {
    expect(() =>
      renderCluster(
        consumerFlowDatasets(),
        withConfig({
          // onex-token-exempt: the literal is the SUBJECT of the test — the
          // component must refuse a threshold that carries a colour value.
          thresholds: [{ value: 10, color: '#ef4444', label: 'High' }],
        }),
      ),
    ).toThrow(/colour VALUE upstream rather than a theme token name/);
  });

  it('refuses an envelope that is not a metric card', () => {
    const wrong = {
      ...CONSUMER_FLOW_BACKLOG,
      config: { ...CONFIG, config_kind: 'chart' },
    } as ModelWidgetEnvelope;
    expect(() => renderCluster(consumerFlowDatasets(), wrong)).toThrow(
      /received a 'chart' config/,
    );
  });

  it('formats by the config-declared format and precision', () => {
    const percent = renderCluster(
      consumerFlowDatasets(),
      withConfig({ format: 'percent', precision: 1 }),
    );
    expect(
      card(percent, 'flow.projection-event-chain').querySelector('[data-onex-card-value]')
        ?.textContent,
    ).toContain('1840.0%');
  });

  it('pins no colour — every value resolves through a token', () => {
    const container = renderCluster();
    const widget = container.querySelector<HTMLElement>('[data-onex-widget]');
    expect(widget).not.toBeNull();
    for (const element of widget?.querySelectorAll<HTMLElement>('[style]') ?? []) {
      expect(element.getAttribute('style') ?? '').not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(element.getAttribute('style') ?? '').not.toMatch(/\b(rgb|hsl|oklch)\s*\(/i);
    }
  });
});
