// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    // Storybook's own chrome is not a themed surface; stories mount their own
    // <ThemeProvider> so that what you see is what a host would render.
    layout: 'fullscreen',
  },
};

export default preview;
