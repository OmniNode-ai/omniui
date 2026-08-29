// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The throughput trend, in the states it can be in (OMN-16937).
 *
 * The story that matters most is **Unobserved window**, which is the default:
 * the captured series carries one window that was never observed, and the
 * chart's job is to leave a visible hole there rather than to draw a plunge to
 * zero. A reviewer should be able to see the gap without reading a test.
 */

import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import type { HostDatasets } from '../binding/index.js';
import { fixtureTheme } from '../fixtures/index.js';
import { CONSUMER_FLOW_THROUGHPUT, throughputDatasets } from '../fixtures/widgets.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';
import { tokenRef } from '../theme/css-variables.js';

import { TrendChart } from './TrendChart.js';

const TOPIC = 'onex.snapshot.projection.consumer-flow.v1';

function Chart({
  datasets = throughputDatasets(),
  themeId = 'onex.theme.dark',
}: {
  readonly datasets?: HostDatasets;
  readonly themeId?: string;
}): ReactNode {
  return (
    <ThemeProvider theme={fixtureTheme(themeId)}>
      <div style={{ padding: tokenRef('spacing_lg'), background: tokenRef('color_background_primary') }}>
        <TrendChart envelope={CONSUMER_FLOW_THROUGHPUT} datasets={datasets} />
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Components/TrendChart',
  component: Chart,
} satisfies Meta<typeof Chart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The captured series: intake climbing, output flatlined, one window unobserved. */
export const UnobservedWindow: Story = {
  render: () => <Chart />,
};

/** The same series with the unobserved window removed — one unbroken line. */
export const FullyObserved: Story = {
  render: () => (
    <Chart
      datasets={{
        throughput: {
          projection_topic: TOPIC,
          rows: (throughputDatasets().throughput?.rows ?? []).filter(
            (row) => row.messages_in !== null,
          ),
        },
      }}
    />
  ),
};

/** The same envelope under a different published theme. */
export const Light: Story = {
  render: () => <Chart themeId="onex.theme.light" />,
};

/** The read never happened. */
export const UpstreamBlocked: Story = {
  render: () => <Chart datasets={{}} />,
};

/** The read happened and returned nothing. */
export const NoRows: Story = {
  render: () => <Chart datasets={{ throughput: { projection_topic: TOPIC, rows: [] } }} />,
};
