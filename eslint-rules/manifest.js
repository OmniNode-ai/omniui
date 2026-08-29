// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The generated-artifact manifest, and the one place it is interpreted
 * (OMN-16888).
 *
 * Two surfaces read it and they must agree, so neither owns it:
 *
 * - `generated-artifact-parity` (ESLint) reports inline, on the `.ts` artifacts
 *   ESLint can lint.
 * - `scripts/check-generated-artifacts.ts` walks the whole repo, **every
 *   extension**, and is the complete check. ESLint has no CSS language, so the
 *   compiled `.css` artifacts are invisible to the rule and would otherwise be
 *   the one class of generated file nothing declared.
 *
 * Both run inside the required `build` job.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** The GENERATED banner every compiled artifact in this repo carries. */
export const BANNER = 'GENERATED FILE — DO NOT EDIT.';

/** The banner is a header: only this many leading lines are inspected for it. */
export const BANNER_HEADER_LINES = 12;

let cache;

/**
 * Load the manifest.
 *
 * @returns {{ artifacts: { pattern: string, source: string, regenerate: string, parity_checker: string }[] }} The manifest.
 */
export function loadManifest() {
  cache ??= JSON.parse(readFileSync(join(HERE, 'generated-artifacts.json'), 'utf8'));
  return cache;
}

/**
 * The manifest entry covering a repo-relative path, if any.
 *
 * @param {string} repoRelative - Path relative to the repo root, `/`-separated.
 * @returns {{ pattern: string, source: string, regenerate: string, parity_checker: string } | undefined} The entry, or undefined.
 */
export function declaredFor(repoRelative) {
  return loadManifest().artifacts.find((entry) => new RegExp(entry.pattern).test(repoRelative));
}

/**
 * Does this text carry the GENERATED banner in its header?
 *
 * Only the head of the file counts. A file that mentions the string further
 * down — a test asserting on it, a doc explaining it — is not an artifact, and
 * a rule that cannot tell the difference reports its own regression tests.
 *
 * @param {string} text - The file's contents.
 * @returns {boolean} True when the banner is in the header.
 */
export function hasBanner(text) {
  return text.split('\n', BANNER_HEADER_LINES).join('\n').includes(BANNER);
}
