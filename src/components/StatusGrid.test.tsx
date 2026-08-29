// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Gate G1B.2, asserted with colour removed (OMN-16936).
 *
 * Every assertion in this file reads a text label, a glyph identifier, or a
 * declared empty-state reason. **None of them reads a colour**, and that is
 * the point: the gate's falsifier is "a severity distinguishable only by hue",
 * so a test suite that asserted on hues would pass on exactly the board the
 * gate is written to reject. The one colour-related test asserts the opposite
 * direction — that no colour is *pinned* in the markup.
 */

import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixtureTheme } from '../fixtures/index.js';
import {
  SYSTEM_HEALTH_BOARD,
  consumerFlowDatasets,
} from '../fixtures/widgets.js';
import type { HostDatasets } from '../binding/index.js';
import type { ModelWidgetConfigStatusGrid } from '../generated/onex-models.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';

import { StatusGrid } from './StatusGrid.js';

/**
 * Render the board under a theme.
 *
 * @param datasets - What the host delivered.
 * @param themeId - Which published theme to activate.
 * @returns The container.
 */
function renderBoard(
  datasets: HostDatasets = consumerFlowDatasets(),
  themeId = 'onex.theme.dark',
): HTMLElement {
  const { container } = render(
    <ThemeProvider theme={fixtureTheme(themeId)}>
      <StatusGrid envelope={SYSTEM_HEALTH_BOARD} datasets={datasets} />
    </ThemeProvider>,
  );
  return container;
}

/**
 * Read one tile.
 *
 * @param container - The rendered container.
 * @param key - The tile key.
 * @returns The tile element.
 */
function tile(container: HTMLElement, key: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(`[data-onex-tile="${key}"]`);
  if (found === null) {
    throw new Error(`no tile '${key}' in the render`);
  }
  return found;
}

/**
 * The severity label and glyph a tile is showing, with colour irrelevant.
 *
 * @param element - The tile.
 * @returns Its label and icon identifier.
 */
function legibility(element: HTMLElement): { label: string; icon: string } {
  const severity = within(element).getByText(
    (_content, node) => node?.hasAttribute('data-onex-severity-label') === true,
  );
  const icon = element.querySelector('[data-onex-tile-severity] [data-onex-icon]');
  return {
    label: severity.textContent ?? '',
    icon: icon?.getAttribute('data-onex-icon') ?? '',
  };
}

describe('StatusGrid — the system-health board', () => {
  it('renders one tile per declared item, from the envelope alone', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const container = renderBoard();
    expect(container.querySelectorAll('[data-onex-tile]')).toHaveLength(
      (config.items ?? []).length,
    );
    expect(container.querySelector('[data-onex-widget]')?.getAttribute('data-onex-widget')).toBe(
      'onex.widget.system_health_board',
    );
  });

  it('renders STALLED and STARVED as critical', () => {
    const container = renderBoard();
    for (const key of ['flow.gateway-link-health', 'flow.gateway-forwarder']) {
      expect(tile(container, key).getAttribute('data-onex-severity'), key).toBe('critical');
    }
  });

  it('renders IDLE as a non-alarm tile that is not FLOWING and not critical', () => {
    const container = renderBoard();
    const idle = tile(container, 'flow.version-skew-detector');
    const flowing = tile(container, 'flow.projection-event-chain');
    const stalled = tile(container, 'flow.gateway-link-health');

    expect(idle.getAttribute('data-onex-severity')).not.toBe('critical');
    expect(idle.getAttribute('data-onex-severity')).not.toBe(
      flowing.getAttribute('data-onex-severity'),
    );
    // The falsifier the gate names by hand: IDLE and STALLED rendering alike.
    expect(legibility(idle)).not.toStrictEqual(legibility(stalled));
    expect(legibility(idle)).not.toStrictEqual(legibility(flowing));
  });

  it('renders UNKNOWN as unknown, never as healthy', () => {
    const container = renderBoard();
    const unknown = tile(container, 'flow.ticket-pipeline');
    expect(unknown.getAttribute('data-onex-severity')).toBe('unknown');
    expect(unknown.getAttribute('data-onex-severity')).not.toBe('nominal');
    expect(legibility(unknown).label).toBe('Unknown');
  });

  it('makes every severity distinguishable by text and icon, with colour removed', () => {
    const container = renderBoard();
    const seen = new Map<string, { label: string; icon: string }>();
    for (const element of container.querySelectorAll<HTMLElement>(
      '[data-onex-tile-state="resolved"]',
    )) {
      const severity = element.getAttribute('data-onex-severity') ?? '';
      seen.set(severity, legibility(element));
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    const labels = [...seen.values()].map((entry) => entry.label);
    const icons = [...seen.values()].map((entry) => entry.icon);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(icons).size).toBe(icons.length);
    expect(labels.every((label) => label.length > 0)).toBe(true);
  });

  it('shows the upstream status word alongside the severity, not instead of it', () => {
    // 'critical' is this library's vocabulary; 'STALLED' is the projection's.
    // An operator asking "stalled or starved?" needs the second one.
    const container = renderBoard();
    const stalled = tile(container, 'flow.gateway-link-health');
    const starved = tile(container, 'flow.gateway-forwarder');
    expect(stalled.getAttribute('data-onex-status-value')).toBe('STALLED');
    expect(starved.getAttribute('data-onex-status-value')).toBe('STARVED');
    expect(stalled.textContent).toContain('STALLED');
  });

  it('renders a tile whose read never happened as a declared empty state', () => {
    // chain.liveness binds a projection that does not exist yet (OMN-16779).
    const container = renderBoard();
    const chain = tile(container, 'chain.liveness');
    expect(chain.getAttribute('data-onex-tile-state')).toBe('empty');
    expect(
      chain.querySelector('[data-onex-empty-reason]')?.getAttribute('data-onex-empty-reason'),
    ).toBe('upstream-blocked');
    // Never healthy, and never the config's own stale verdict.
    expect(chain.getAttribute('data-onex-severity')).toBeNull();
  });

  it('renders a tile whose read failed as empty rather than as its sealed verdict', () => {
    // The FLOWING tile's config says nominal. Take its read away and it must
    // stop claiming that: a broken read must never render as health.
    const container = renderBoard(consumerFlowDatasets({ omit: ['flow.projection-event-chain'] }));
    const flowing = tile(container, 'flow.projection-event-chain');
    expect(flowing.getAttribute('data-onex-tile-state')).toBe('empty');
    expect(flowing.getAttribute('data-onex-severity')).toBeNull();
    expect(flowing.textContent).not.toContain('Nominal');
  });

  it('distinguishes a read that returned nothing from a read that never happened', () => {
    const datasets: HostDatasets = {
      ...consumerFlowDatasets(),
      'flow.projection-event-chain': {
        projection_topic: 'onex.snapshot.projection.consumer-flow.v1',
        rows: [],
      },
    };
    const container = renderBoard(datasets);
    expect(
      tile(container, 'flow.projection-event-chain')
        .querySelector('[data-onex-empty-reason]')
        ?.getAttribute('data-onex-empty-reason'),
    ).toBe('no-data');
    expect(
      tile(container, 'chain.liveness')
        .querySelector('[data-onex-empty-reason]')
        ?.getAttribute('data-onex-empty-reason'),
    ).toBe('upstream-blocked');
  });

  it('renders an unobserved counter as "no reading", never as zero', () => {
    // OMN-16777 AC5, the whole reason the projection distinguishes null from 0.
    const container = renderBoard();
    const unknown = tile(container, 'flow.ticket-pipeline');
    expect(
      unknown.querySelector('[data-onex-tile-secondary]')?.getAttribute('data-onex-tile-secondary'),
    ).toBe('none');
    expect(unknown.textContent).toContain('No reading');
    expect(unknown.textContent).not.toMatch(/\b0\b/);
  });

  it('keeps an observed zero as a zero', () => {
    const container = renderBoard();
    const starved = tile(container, 'flow.gateway-forwarder');
    expect(starved.querySelector('[data-onex-tile-secondary-value]')?.textContent).toBe('0');
    expect(starved.textContent).not.toContain('No reading');
  });

  it('pins no colour of its own — every value resolves through a token', () => {
    const container = renderBoard();
    const widget = container.querySelector<HTMLElement>('[data-onex-widget]');
    expect(widget).not.toBeNull();
    // Scoped INSIDE the widget on purpose. The ThemeProvider's own scope
    // element carries the theme's token VALUES as custom properties — that is
    // what publishing a theme means — and asserting over it would be asserting
    // that the theme has no colours in it.
    for (const element of widget?.querySelectorAll<HTMLElement>('[style]') ?? []) {
      const style = element.getAttribute('style') ?? '';
      expect(style, element.outerHTML.slice(0, 120)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(style).not.toMatch(/\b(rgb|hsl|oklch)\s*\(/i);
    }
  });

  it('resolves severity colour from the ACTIVE theme, so switching it changes the render', () => {
    // G1B.3. The token NAME is fixed by the config; the VALUE comes from the
    // instance the host activated, and the two published themes disagree on it.
    const dark = renderBoard(consumerFlowDatasets(), 'onex.theme.dark');
    const light = renderBoard(consumerFlowDatasets(), 'onex.theme.light');
    const read = (container: HTMLElement): string =>
      container.querySelector('[data-onex-theme-digest]')?.getAttribute('data-onex-theme-digest') ??
      '';
    expect(read(dark)).not.toBe(read(light));

    const darkTokens = fixtureTheme('onex.theme.dark').tokens;
    const lightTokens = fixtureTheme('onex.theme.light').tokens;
    // The critical role's declared token, resolved through each instance.
    expect(darkTokens.color_status_error).not.toBe(lightTokens.color_status_error);
    const severityStyle =
      tile(dark, 'flow.gateway-link-health')
        .querySelector('[data-onex-tile-severity]')
        ?.getAttribute('style') ?? '';
    expect(severityStyle).toContain('var(--onex-color-status-error)');
  });

  it('refuses an envelope that is not a status grid', () => {
    const wrong = {
      ...SYSTEM_HEALTH_BOARD,
      config: { ...SYSTEM_HEALTH_BOARD.config, config_kind: 'chart' },
    } as typeof SYSTEM_HEALTH_BOARD;
    expect(() =>
      render(
        <ThemeProvider theme={fixtureTheme('onex.theme.dark')}>
          <StatusGrid envelope={wrong} datasets={consumerFlowDatasets()} />
        </ThemeProvider>,
      ),
    ).toThrow(/received a 'chart' config/);
  });

  it('refuses a tile whose severity the config gives no presentation', () => {
    const config = SYSTEM_HEALTH_BOARD.config as ModelWidgetConfigStatusGrid;
    const stripped = {
      ...SYSTEM_HEALTH_BOARD,
      config: {
        ...config,
        severity_roles: (config.severity_roles ?? []).filter(
          (role) => role.severity !== 'critical',
        ),
      },
    } as typeof SYSTEM_HEALTH_BOARD;
    expect(() =>
      render(
        <ThemeProvider theme={fixtureTheme('onex.theme.dark')}>
          <StatusGrid envelope={stripped} datasets={consumerFlowDatasets()} />
        </ThemeProvider>,
      ),
    ).toThrow(/declares no severity role for 'critical'/);
  });
});
