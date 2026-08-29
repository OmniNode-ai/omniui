// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The Style Reference Guide, delivered as Storybook (OMN-14035, closed against D1).
 *
 * Every value on this page is read back out of the active theme. There is no
 * hand-written swatch list, so the guide cannot drift from the theme it
 * documents — if a token is added to an instance it appears here, and if one is
 * removed it disappears.
 */

import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { ThemeProvider, useTheme } from './ThemeProvider.js';
import { sortedTokenNames, tokenRef, tokenVarName } from './css-variables.js';
import { FIXTURE_THEME_PAPER, FIXTURE_THEME_SLATE } from './theme-fixtures.js';

const COLOR_VALUE = /^(#|rgb|hsl|oklch)/i;

function TokenRow({ token }: { readonly token: string }): ReactNode {
  const theme = useTheme();
  const value = theme.tokens[token]!;
  const isColor = COLOR_VALUE.test(value);
  return (
    <tr>
      <td style={{ padding: tokenRef('spacing_sm'), fontFamily: 'monospace' }}>{token}</td>
      <td style={{ padding: tokenRef('spacing_sm'), fontFamily: 'monospace' }}>
        {tokenVarName(token)}
      </td>
      <td style={{ padding: tokenRef('spacing_sm'), fontFamily: 'monospace' }}>{value}</td>
      <td style={{ padding: tokenRef('spacing_sm') }}>
        {isColor ? (
          <span
            aria-label={`swatch for ${token}`}
            style={{
              display: 'inline-block',
              inlineSize: '2rem',
              blockSize: '1rem',
              background: tokenRef(token),
              border: `1px solid ${tokenRef('color_border_default')}`,
              borderRadius: tokenRef('border_radius_md'),
            }}
          />
        ) : null}
      </td>
    </tr>
  );
}

function ThemeReference(): ReactNode {
  const theme = useTheme();
  return (
    <div
      style={{
        background: tokenRef('color_background_primary'),
        color: tokenRef('color_text_primary'),
        fontFamily: tokenRef('font_family_base'),
        fontSize: tokenRef('font_size_md'),
        padding: tokenRef('spacing_md'),
      }}
    >
      <h2>{theme.identity.themeId}</h2>
      <p style={{ color: tokenRef('color_text_secondary') }}>
        revision {theme.identity.instanceRevision} · schema {theme.identity.schemaVersion} ·{' '}
        {theme.identity.contentDigest}
      </p>
      <table style={{ borderCollapse: 'collapse', inlineSize: '100%' }}>
        <thead>
          <tr style={{ textAlign: 'start', color: tokenRef('color_text_secondary') }}>
            <th style={{ padding: tokenRef('spacing_sm') }}>token</th>
            <th style={{ padding: tokenRef('spacing_sm') }}>custom property</th>
            <th style={{ padding: tokenRef('spacing_sm') }}>value</th>
            <th style={{ padding: tokenRef('spacing_sm') }}>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {sortedTokenNames(theme.tokens).map((token) => (
            <TokenRow key={token} token={token} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: 'Theme/Style Reference',
  component: ThemeReference,
} satisfies Meta<typeof ThemeReference>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Slate: Story = {
  render: () => (
    <ThemeProvider theme={FIXTURE_THEME_SLATE}>
      <ThemeReference />
    </ThemeProvider>
  ),
};

export const Paper: Story = {
  render: () => (
    <ThemeProvider theme={FIXTURE_THEME_PAPER}>
      <ThemeReference />
    </ThemeProvider>
  ),
};
