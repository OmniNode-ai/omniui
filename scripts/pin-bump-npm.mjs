// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Rewrite a consumer's exact omniui pin (OMN-16887, Phase 1A.3).
 *
 * ```
 * node scripts/pin-bump-npm.mjs \
 *   --manifest docs/downstream-consumers.json \
 *   --repo omnidash --repo-root ../downstream --new-version 0.1.0
 * ```
 *
 * Adapted from `omnibase_core`'s downstream pin-bump (OMN-9050), which pins by
 * git SHA and rewrites a regex match in workflow files. omniui pins by **exact
 * npm version** in a `package.json` dependency entry, which changes the failure
 * mode: the caller must regenerate the lockfile afterwards, because the
 * lockfile carries the integrity hash. **Rewriting `package.json` without
 * regenerating the lockfile produces a pin that says one thing and installs
 * another** — more dangerous than not bumping at all, so the workflow does the
 * regeneration and then asserts the lockfile moved.
 *
 * Exact versions only. A range defeats D2b's exact-pinning property, so a
 * non-exact version is refused rather than normalised.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Parse `--flag value` pairs.
 *
 * @param {string[]} argv - Raw arguments.
 * @returns {Record<string, string>} Parsed flags.
 */
function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === undefined || !flag.startsWith('--') || value === undefined) {
      throw new Error(`bad argument near '${String(flag)}'`);
    }
    out[flag.slice(2)] = value;
  }
  return out;
}

function fail(message) {
  process.stderr.write(`pin-bump: ${message}\n`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
for (const required of ['manifest', 'repo', 'repo-root', 'new-version']) {
  if (args[required] === undefined) fail(`missing --${required}`);
}

const newVersion = args['new-version'];
if (!EXACT_VERSION.test(newVersion)) {
  fail(`refusing to pin non-exact version '${newVersion}' — D2b requires exact pins`);
}

const manifest = JSON.parse(readFileSync(args.manifest, 'utf8'));
const entry = manifest.repos.find((repo) => repo.name === args.repo);
if (entry === undefined) {
  fail(`repo '${args.repo}' is not registered in ${args.manifest}`);
}
if (entry.pin_sites.length === 0) {
  fail(
    `repo '${args.repo}' is registered but declares no pin sites — it does not consume omniui yet`,
  );
}

let rewrites = 0;
for (const site of entry.pin_sites) {
  const path = join(args['repo-root'], site.path);
  const raw = readFileSync(path, 'utf8');
  const pkg = JSON.parse(raw);
  const section = pkg[site.section];
  if (section === undefined || section[site.dependency] === undefined) {
    fail(`${site.path}: no '${site.dependency}' under '${site.section}'`);
  }
  const before = section[site.dependency];
  if (before === newVersion) {
    process.stdout.write(`  ${site.path}: already at ${newVersion}\n`);
    continue;
  }
  section[site.dependency] = newVersion;

  // Preserve the file's own trailing-newline convention rather than imposing
  // one: a bump PR whose diff is mostly whitespace is a bump PR nobody reads.
  const trailing = raw.endsWith('\n') ? '\n' : '';
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}${trailing}`, 'utf8');
  process.stdout.write(`  ${site.path}: ${before} -> ${newVersion}\n`);
  rewrites += 1;
}

process.stdout.write(
  `pin-bump: ${String(rewrites)} site(s) rewritten in ${args.repo}. ` +
    'Regenerate the lockfile before committing — the integrity hash must move with the version.\n',
);
