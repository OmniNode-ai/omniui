// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The four reasons stay four, and none of them is a blank (OMN-16935).
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixtureTheme } from '../fixtures/index.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';
import type { EnumEmptyStateReason } from '../generated/onex-models.js';

import { EmptyState } from './EmptyState.js';
import { Icon } from './Icon.js';

const REASONS: readonly EnumEmptyStateReason[] = [
  'no-data',
  'missing-field',
  'upstream-blocked',
  'schema-invalid',
];

/**
 * Render inside a theme, the way every surface must.
 *
 * @param reason - The declared reason.
 * @returns The rendered container.
 */
function renderReason(reason: EnumEmptyStateReason): HTMLElement {
  const { container } = render(
    <ThemeProvider theme={fixtureTheme('onex.theme.dark')}>
      <EmptyState reason={reason} detail={`detail for ${reason}`} />
    </ThemeProvider>,
  );
  return container;
}

describe('EmptyState', () => {
  it('stamps the declared reason on the DOM rather than only in prose', () => {
    for (const reason of REASONS) {
      const container = renderReason(reason);
      expect(container.querySelector(`[data-onex-empty-reason="${reason}"]`)).not.toBeNull();
    }
  });

  it('gives every reason a distinct label and a distinct icon', () => {
    const labels = new Set<string>();
    const icons = new Set<string>();
    for (const reason of REASONS) {
      const container = renderReason(reason);
      const label = container.querySelector('[data-onex-empty-label]')?.textContent ?? '';
      const icon = container.querySelector('[data-onex-icon]')?.getAttribute('data-onex-icon') ?? '';
      expect(label).not.toBe('');
      expect(icon).not.toBe('');
      labels.add(label);
      icons.add(icon);
    }
    expect(labels.size).toBe(REASONS.length);
    expect(icons.size).toBe(REASONS.length);
  });

  it('does not collapse schema-invalid into no-data', () => {
    const invalid = renderReason('schema-invalid').querySelector('[data-onex-empty-label]');
    const noData = renderReason('no-data').querySelector('[data-onex-empty-label]');
    expect(invalid?.textContent).not.toBe(noData?.textContent);
  });

  it('surfaces the operator-facing detail, not just the category', () => {
    const container = renderReason('missing-field');
    expect(container.querySelector('[data-onex-empty-detail]')?.textContent).toBe(
      'detail for missing-field',
    );
  });

  it('announces itself, so an operator on a screen reader learns the read failed', () => {
    renderReason('upstream-blocked');
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('names no colour of its own — every value resolves through a token', () => {
    const container = renderReason('no-data');
    const style = container.querySelector('[data-onex-empty-reason]')?.getAttribute('style') ?? '';
    expect(style).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(style).toMatch(/var\(--onex-/);
  });
});

describe('Icon', () => {
  it('refuses an identifier it cannot draw rather than rendering a blank', () => {
    expect(() => render(<Icon name="not-a-real-glyph" />)).toThrow(/not in the vocabulary/);
  });

  it('carries its identifier on the DOM so a test can assert shape without colour', () => {
    const { container } = render(<Icon name="octagon-alert" title="Critical" />);
    expect(container.querySelector('[data-onex-icon="octagon-alert"]')).not.toBeNull();
    expect(container.querySelector('title')?.textContent).toBe('Critical');
  });

  it('inherits colour from its caller and names none', () => {
    const { container } = render(<Icon name="circle-check" />);
    expect(container.querySelector('svg')?.getAttribute('stroke')).toBe('currentColor');
  });
});
