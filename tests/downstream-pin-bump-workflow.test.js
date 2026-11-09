// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The downstream pin bump runs only by dispatch (OMN-18594).
 *
 * RULING 2026-11-09T21:54:25Z lane=orchestrator-31d9: a downstream repository
 * moves its pin on a sibling only when it needs something new from it. The
 * workflow used to run on every published release; it keeps workflow_dispatch so
 * a needed bump stays one command.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const WORKFLOW = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.github',
  'workflows',
  'downstream-pin-bump.yml',
);

// The text of the top-level `on:` block, up to the next top-level key.
function triggerBlock() {
  const text = readFileSync(WORKFLOW, 'utf8');
  const match = text.match(/^on:\n((?:[ \t]+.*\n|\n)*)/m);
  if (!match) throw new Error('downstream-pin-bump.yml has no on: block');
  return match[1];
}

describe('downstream-pin-bump.yml triggers', () => {
  it('keeps workflow_dispatch', () => {
    expect(triggerBlock()).toMatch(/^ {2}workflow_dispatch:/m);
  });

  it('has no automatic trigger', () => {
    const keys = [...triggerBlock().matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]);
    expect(keys).toEqual(['workflow_dispatch']);
  });
});
