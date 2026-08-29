// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Gate G1B.1, made mechanical (OMN-16935).
 *
 * The gate reads: *"the three types render from a C2 envelope fixture, with no
 * direct data fetching in component code"*, falsified by *"any component that
 * calls a query hook itself"*. Everything in that sentence is checkable by
 * reading the component sources, and nothing about it is checkable by a
 * reviewer remembering to look — which is Operating Rule #5's whole point.
 *
 * So this walks every module under `src/components/` and fails on any I/O
 * surface. It is deliberately a **source** test rather than a runtime mock: a
 * runtime test proves that the fetch did not happen *in that render*, and this
 * proves the code to make it does not exist. The plan's §1.1 diagnosis is that
 * omnidash's components "own their own data fetching" and that this is the
 * behaviour being replaced; a gate that could be satisfied by a lazily-invoked
 * fetch would not have caught it.
 *
 * The list only grows. Adding a way to fetch means adding it here first, in a
 * PR whose diff says so.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const COMPONENTS_DIR = dirname(fileURLToPath(import.meta.url));

/** Anything that reaches the network, a store, or a query layer. */
const FORBIDDEN: readonly { readonly pattern: RegExp; readonly why: string }[] = [
  { pattern: /\bfetch\s*\(/, why: 'a direct fetch call' },
  { pattern: /globalThis\s*\.\s*fetch/, why: 'a reference to the global fetch' },
  { pattern: /\bXMLHttpRequest\b/, why: 'an XMLHttpRequest' },
  { pattern: /\bnew\s+WebSocket\b/, why: 'a WebSocket' },
  { pattern: /\bnew\s+EventSource\b/, why: 'an EventSource' },
  { pattern: /\buse[A-Z][A-Za-z]*Query\b/, why: 'a query hook' },
  { pattern: /\buse[A-Z][A-Za-z]*Mutation\b/, why: 'a mutation hook' },
  { pattern: /\buseSWR\b/, why: 'an SWR hook' },
  { pattern: /from\s+['"](axios|ky|superagent|got)['"]/, why: 'an HTTP client import' },
  {
    pattern: /from\s+['"]@tanstack\/react-query['"]/,
    why: 'a react-query import',
  },
  { pattern: /from\s+['"]node:(fs|http|https|net)['"]/, why: 'a node I/O import' },
  { pattern: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/, why: 'browser storage' },
];

/**
 * Every component source file, tests and stories excluded.
 *
 * Tests are excluded because this file itself has to contain the patterns it
 * forbids; stories are excluded because a story is a host, and a host is
 * exactly the thing that is allowed to have data.
 *
 * @param dir - Directory to walk.
 * @returns Absolute paths.
 */
function componentSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...componentSources(full));
      continue;
    }
    if (!['.ts', '.tsx'].includes(extname(entry.name))) {
      continue;
    }
    if (/\.(test|stories)\.tsx?$/.test(entry.name)) {
      continue;
    }
    out.push(full);
  }
  return out;
}

describe('G1B.1 — no component-owned data fetching', () => {
  const sources = componentSources(COMPONENTS_DIR);

  it('finds component sources to check, so a rename cannot silently empty the gate', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(sources.map((path) => [path.slice(COMPONENTS_DIR.length + 1), path]))(
    '%s performs no I/O of its own',
    (_label, path) => {
      const text = readFileSync(path, 'utf8');
      for (const { pattern, why } of FORBIDDEN) {
        expect(
          pattern.test(text),
          `${path} contains ${why}. A component receives its data through the ` +
            'widget envelope\'s bindings, resolved by the host — see plan §2.2.',
        ).toBe(false);
      }
    },
  );
});
