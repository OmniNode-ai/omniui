// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Consumer intake, one card per bound source (OMN-16938).
 *
 * The card to look at is **flow.ticket-pipeline**: its window was never
 * observed, so it reads "No reading" while its neighbour reads a genuine `0`.
 * Those two cards sitting side by side are the whole argument for why the
 * projection distinguishes `null` from `0` in the first place.
 */

import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import type { HostDatasets } from '../binding/index.js';
import { fixtureTheme } from '../fixtures/index.js';
import { CONSUMER_FLOW_BACKLOG, consumerFlowDatasets } from '../fixtures/widgets.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';
import { tokenRef } from '../theme/css-variables.js';

import { MetricCluster } from './MetricCluster.js';

function Cluster({
  datasets = consumerFlowDatasets(),
  themeId = 'onex.theme.dark',
  monochrome = false,
}: {
  readonly datasets?: HostDatasets;
  readonly themeId?: string;
  readonly monochrome?: boolean;
}): ReactNode {
  return (
    <ThemeProvider theme={fixtureTheme(themeId)}>
      <div
        style={{
          padding: tokenRef('spacing_lg'),
          background: tokenRef('color_background_primary'),
          filter: monochrome ? 'grayscale(1)' : undefined,
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: tokenRef('spacing_md'),
            color: tokenRef('color_text_primary'),
            fontFamily: tokenRef('font_family_base'),
            fontSize: tokenRef('font_size_lg'),
          }}
        >
          {CONSUMER_FLOW_BACKLOG.component.title}
        </h2>
        <MetricCluster envelope={CONSUMER_FLOW_BACKLOG} datasets={datasets} />
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Components/MetricCluster',
  component: Cluster,
} satisfies Meta<typeof Cluster>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Five sources: an observed zero, an unobserved window, and three readings. */
export const ConsumerIntake: Story = {
  render: () => <Cluster />,
};

/** Trend direction survives colour removal, because it is an arrow and a word. */
export const Monochrome: Story = {
  render: () => <Cluster monochrome />,
};

/** The same envelope under a different published theme. */
export const Light: Story = {
  render: () => <Cluster themeId="onex.theme.light" />,
};

/** One source's read taken away — one card declares why, the rest carry on. */
export const OneReadMissing: Story = {
  render: () => <Cluster datasets={consumerFlowDatasets({ omit: ['flow.gateway-forwarder'] })} />,
};
