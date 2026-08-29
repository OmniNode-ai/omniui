// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The pin bump rewrites what it says it rewrites, and refuses what it must
 * (OMN-16887).
 *
 * The pin-bump half of D2b is not optional: the failure mode this plan exists
 * to prevent is not "we published to the wrong registry", it is **"nothing
 * downstream ever consumed what we published"**. A bump path that is only
 * exercised the first time a real consumer registers is a bump path nobody has
 * checked.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(REPO_ROOT, 'scripts', 'pin-bump-npm.mjs');

let scratch;

beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), 'omniui-pinbump-'));
});

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
});

function writeManifest(pinSites) {
  const path = join(scratch, 'manifest.json');
  writeFileSync(
    path,
    JSON.stringify({
      version: 1,
      repos: [
        {
          name: 'consumer',
          owner: 'OmniNode-ai',
          base_branch: 'dev',
          pin_sites: pinSites,
          lockfile: 'package-lock.json',
        },
      ],
    }),
    'utf8',
  );
  return path;
}

function run(args) {
  return execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', cwd: scratch });
}

function runExpectingFailure(args) {
  try {
    execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', cwd: scratch, stdio: 'pipe' });
  } catch (error) {
    return String(error.stderr ?? '');
  }
  throw new Error('expected the bump to fail, but it succeeded');
}

describe('pin-bump-npm', () => {
  it('rewrites an exact pin and leaves the rest of the manifest alone', () => {
    const consumer = join(scratch, 'consumer');
    mkdirSync(consumer, { recursive: true });
    writeFileSync(
      join(consumer, 'package.json'),
      `${JSON.stringify(
        {
          name: 'consumer',
          dependencies: { '@omninode/omniui': '0.0.1', react: '19.0.0' },
          devDependencies: { vitest: '2.1.8' },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const manifest = writeManifest([
      { path: 'package.json', dependency: '@omninode/omniui', section: 'dependencies' },
    ]);

    const output = run([
      '--manifest', manifest,
      '--repo', 'consumer',
      '--repo-root', consumer,
      '--new-version', '0.2.0',
    ]);
    expect(output).toContain('0.0.1 -> 0.2.0');

    const after = JSON.parse(readFileSync(join(consumer, 'package.json'), 'utf8'));
    expect(after.dependencies['@omninode/omniui']).toBe('0.2.0');
    // Everything else must be untouched: a bump PR whose diff is mostly
    // collateral is a bump PR nobody reads.
    expect(after.dependencies.react).toBe('19.0.0');
    expect(after.devDependencies.vitest).toBe('2.1.8');
    expect(readFileSync(join(consumer, 'package.json'), 'utf8').endsWith('\n')).toBe(true);
  });

  it('refuses a range — an exact pin is the whole point of D2b', () => {
    const manifest = writeManifest([
      { path: 'package.json', dependency: '@omninode/omniui', section: 'dependencies' },
    ]);
    const stderr = runExpectingFailure([
      '--manifest', manifest,
      '--repo', 'consumer',
      '--repo-root', scratch,
      '--new-version', '^0.2.0',
    ]);
    expect(stderr).toContain('refusing to pin non-exact version');
  });

  it('refuses a repo registered with no pin sites', () => {
    const manifest = writeManifest([]);
    const stderr = runExpectingFailure([
      '--manifest', manifest,
      '--repo', 'consumer',
      '--repo-root', scratch,
      '--new-version', '0.2.0',
    ]);
    expect(stderr).toContain('does not consume omniui yet');
  });

  it('refuses a repo that is not registered at all', () => {
    const manifest = writeManifest([]);
    const stderr = runExpectingFailure([
      '--manifest', manifest,
      '--repo', 'stranger',
      '--repo-root', scratch,
      '--new-version', '0.2.0',
    ]);
    expect(stderr).toContain('is not registered');
  });

  it('refuses a pin site whose declared dependency is absent', () => {
    const consumer = join(scratch, 'consumer');
    mkdirSync(consumer, { recursive: true });
    writeFileSync(
      join(consumer, 'package.json'),
      JSON.stringify({ name: 'consumer', dependencies: { react: '19.0.0' } }),
      'utf8',
    );
    const manifest = writeManifest([
      { path: 'package.json', dependency: '@omninode/omniui', section: 'dependencies' },
    ]);
    const stderr = runExpectingFailure([
      '--manifest', manifest,
      '--repo', 'consumer',
      '--repo-root', consumer,
      '--new-version', '0.2.0',
    ]);
    expect(stderr).toContain("no '@omninode/omniui' under 'dependencies'");
  });
});

describe('the shipped consumer registry', () => {
  it('registers consumers without activating any of them yet', () => {
    const manifest = JSON.parse(
      readFileSync(join(REPO_ROOT, 'docs', 'downstream-consumers.json'), 'utf8'),
    );
    // Phase 1A makes zero commits to omnidash or omniweb (G1A.6), so neither
    // consumes the package yet. An active pin site here would mean the bump
    // matrix targets a repo that never took the dependency.
    for (const repo of manifest.repos) {
      expect({ name: repo.name, pinSites: repo.pin_sites }).toStrictEqual({
        name: repo.name,
        pinSites: [],
      });
    }
    expect(manifest.repos.map((r) => r.name).sort()).toStrictEqual(['omnidash', 'omniweb']);
  });
});
