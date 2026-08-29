// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // No timestamps, no machine paths, no snapshot of a clock: the suite is
    // the thing that proves determinism elsewhere, so it must not import any
    // ambient state of its own (plan G0.1, and R-22's counter-example).
    env: {},
    clearMocks: true,
    restoreMocks: true,
  },
});
