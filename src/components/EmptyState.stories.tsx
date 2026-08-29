// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The four declared empty states, side by side (OMN-16935).
 *
 * They are shown together on purpose. The failure this component exists to
 * prevent is a reader treating them as interchangeable, and four cards in a row
 * make it obvious that "the read never happened" and "the read returned
 * nothing" are different sentences an operator would act on differently.
 */

import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { fixtureTheme } from '../fixtures/index.js';
import type { EnumEmptyStateReason } from '../generated/onex-models.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';
import { tokenRef } from '../theme/css-variables.js';

import { EmptyState } from './EmptyState.js';

const CASES: readonly { readonly reason: EnumEmptyStateReason; readonly detail: string }[] = [
  {
    reason: 'upstream-blocked',
    detail:
      "the host delivered no read for binding 'chain.liveness' " +
      "(topic 'onex.snapshot.projection.chain-liveness.v1')",
  },
  {
    reason: 'no-data',
    detail: "topic 'onex.snapshot.projection.consumer-flow.v1' returned no rows",
  },
  {
    reason: 'missing-field',
    detail:
      "row 0 of topic 'onex.snapshot.projection.consumer-flow.v1' has no 'flow_state', " +
      "which binding 'flow.gateway-link-health' declares as required",
  },
  {
    reason: 'schema-invalid',
    detail:
      "binding 'flow.ticket-pipeline' declares topic " +
      "'onex.snapshot.projection.consumer-flow.v1' but the host delivered " +
      "'onex.snapshot.projection.dlq-quarantine.v1'",
  },
];

function EmptyStateGallery(): ReactNode {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
        gap: tokenRef('spacing_md'),
        padding: tokenRef('spacing_lg'),
        background: tokenRef('color_background_primary'),
        fontFamily: tokenRef('font_family_base'),
      }}
    >
      {CASES.map(({ reason, detail }) => (
        <EmptyState key={reason} reason={reason} detail={detail} />
      ))}
    </div>
  );
}

const meta = {
  title: 'Binding/Empty states',
  component: EmptyStateGallery,
} satisfies Meta<typeof EmptyStateGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dark: Story = {
  render: () => (
    <ThemeProvider theme={fixtureTheme('onex.theme.dark')}>
      <EmptyStateGallery />
    </ThemeProvider>
  ),
};

export const Light: Story = {
  render: () => (
    <ThemeProvider theme={fixtureTheme('onex.theme.light')}>
      <EmptyStateGallery />
    </ThemeProvider>
  ),
};
