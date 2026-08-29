// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The system-health board, in every state it can be in (OMN-16936).
 *
 * Including a **Monochrome** story, which is not a novelty: G1B.2 requires
 * every severity to be legible with colour removed, and the honest way to show
 * that is to remove the colour and look. If two tiles become indistinguishable
 * under the greyscale filter, the gate has been failed and the story shows it.
 */

import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import type { HostDatasets } from '../binding/index.js';
import { fixtureTheme } from '../fixtures/index.js';
import { SYSTEM_HEALTH_BOARD, consumerFlowDatasets } from '../fixtures/widgets.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';
import { tokenRef } from '../theme/css-variables.js';

import { StatusGrid } from './StatusGrid.js';

function Board({
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
          {SYSTEM_HEALTH_BOARD.component.title}
        </h2>
        <StatusGrid envelope={SYSTEM_HEALTH_BOARD} datasets={datasets} />
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Components/StatusGrid',
  component: Board,
} satisfies Meta<typeof Board>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every declared flow state at once, plus the tile whose projection does not exist. */
export const SystemHealthBoard: Story = {
  render: () => <Board />,
};

/** The same board and the same envelope, under a different published theme. */
export const Light: Story = {
  render: () => <Board themeId="onex.theme.light" />,
};

/** And a third, to make the point that nothing here is theme-specific. */
export const Warm: Story = {
  render: () => <Board themeId="onex.theme.warm" />,
};

/**
 * G1B.2's actual test, run by eye: colour removed, is every tile still legible?
 */
export const Monochrome: Story = {
  render: () => <Board monochrome />,
};

/** One tile's read taken away — it must stop claiming its sealed verdict. */
export const ReadFailed: Story = {
  render: () => <Board datasets={consumerFlowDatasets({ omit: ['flow.projection-event-chain'] })} />,
};

/** No reads at all: every tile declares why, and none of them looks healthy. */
export const NothingRead: Story = {
  render: () => <Board datasets={{}} />,
};
