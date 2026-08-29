// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider, useTheme } from './ThemeProvider.js';
import {
  THEME_DIGEST_VAR,
  THEME_ID_VAR,
  themeToCssProperties,
  tokenRef,
  tokenVarName,
} from './css-variables.js';
import { FIXTURE_THEME_PAPER, FIXTURE_THEME_SLATE } from './theme-fixtures.js';
import { assertReportableTheme, type Theme } from './theme-token-set.js';

function AccentSwatch(): ReactNode {
  return (
    <div data-testid="swatch" style={{ backgroundColor: tokenRef('color_accent_primary') }} />
  );
}

function ThemeReporter(): ReactNode {
  const theme = useTheme();
  return <span data-testid="reported">{`${theme.identity.themeId}@${theme.identity.instanceRevision}`}</span>;
}

describe('tokenVarName / tokenRef', () => {
  it('maps a contract token name to one prefixed custom property', () => {
    expect(tokenVarName('color_accent_primary')).toBe('--onex-color-accent-primary');
    expect(tokenRef('spacing_md')).toBe('var(--onex-spacing-md)');
  });
});

describe('ThemeProvider', () => {
  it('publishes every token as a custom property on the scope element', () => {
    const { container } = render(
      <ThemeProvider theme={FIXTURE_THEME_SLATE}>
        <AccentSwatch />
      </ThemeProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--onex-color-accent-primary')).toBe('#6366f1');
    expect(scope.style.getPropertyValue('--onex-spacing-md')).toBe('1rem');
  });

  it('reports theme identity and digest on the rendered surface (G-U1 input)', () => {
    const { container } = render(<ThemeProvider theme={FIXTURE_THEME_SLATE}>x</ThemeProvider>);
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue(THEME_ID_VAR)).toBe('fixture.theme.slate');
    expect(scope.style.getPropertyValue(THEME_DIGEST_VAR)).toBe(
      FIXTURE_THEME_SLATE.identity.contentDigest,
    );
    expect(scope.dataset.onexTheme).toBe('fixture.theme.slate');
  });

  it('changes every published value when the activated instance changes', () => {
    const { container, rerender } = render(
      <ThemeProvider theme={FIXTURE_THEME_SLATE}>x</ThemeProvider>,
    );
    const read = (): string =>
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        '--onex-color-background-primary',
      );
    expect(read()).toBe('#0f172a');
    rerender(<ThemeProvider theme={FIXTURE_THEME_PAPER}>x</ThemeProvider>);
    expect(read()).toBe('#ffffff');
  });

  it('emits token declarations in a stable, sorted order', () => {
    const { container } = render(<ThemeProvider theme={FIXTURE_THEME_SLATE}>x</ThemeProvider>);
    const style = (container.firstElementChild as HTMLElement).getAttribute('style') ?? '';
    const tokenProps = [...style.matchAll(/--onex-([a-z0-9-]+):/g)]
      .map((m) => m[1]!)
      .filter((name) => !name.startsWith('theme-'));
    expect(tokenProps).toStrictEqual([...tokenProps].sort());
  });

  it('exposes the active theme to descendants', () => {
    render(
      <ThemeProvider theme={FIXTURE_THEME_PAPER}>
        <ThemeReporter />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('reported').textContent).toBe('fixture.theme.paper@1.0.0');
  });

  it('refuses to render outside a provider rather than inventing a value', () => {
    expect(() => {
      render(<ThemeReporter />);
    }).toThrow(/outside a <ThemeProvider>/);
  });
});

describe('themeToCssProperties', () => {
  it('refuses a token whose custom property collides with the identity vars', () => {
    // `theme_id` normalises to `--onex-theme-id` and would otherwise overwrite
    // the reported identity, leaving the CSS disagreeing with data-onex-theme.
    const colliding: Theme = {
      ...FIXTURE_THEME_SLATE,
      tokens: { ...FIXTURE_THEME_SLATE.tokens, theme_id: 'not-the-real-id' },
    };
    expect(() => themeToCssProperties(colliding)).toThrow(/collides with/);
  });

  it('refuses two tokens that normalise to the same custom property', () => {
    const colliding: Theme = {
      ...FIXTURE_THEME_SLATE,
      tokens: { ...FIXTURE_THEME_SLATE.tokens, 'color-accent-primary': '#000000' },
    };
    expect(() => themeToCssProperties(colliding)).toThrow(/collides with/);
  });
});

describe('assertReportableTheme', () => {
  it('rejects a theme that cannot report a well-formed digest', () => {
    const unreportable: Theme = {
      ...FIXTURE_THEME_SLATE,
      identity: { ...FIXTURE_THEME_SLATE.identity, contentDigest: 'sha256:nope' },
    };
    expect(() => {
      assertReportableTheme(unreportable);
    }).toThrow(/contentDigest/);
  });

  it('rejects a theme carrying no tokens', () => {
    const empty: Theme = { ...FIXTURE_THEME_SLATE, tokens: {} };
    expect(() => {
      assertReportableTheme(empty);
    }).toThrow(/carries no tokens/);
  });
});
