// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Hermetic by construction. Vite loads `.env` / `.env.local` from the root
  // and injects every matching variable into `import.meta.env`; that is exactly
  // how omnidash's suite ended up green in CI and red on the workstation
  // (plan G0.1 / OMN-16880). No prefix here matches anything, so no dotfile
  // value can reach a test. `vitest.setup.ts` strips the process.env half.
  envPrefix: '__omniui_never_matches__',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'eslint-rules/**/*.test.js',
      'scripts/**/*.test.js',
    ],
    clearMocks: true,
    restoreMocks: true,
  },
});
