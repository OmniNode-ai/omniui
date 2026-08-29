// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `generated-artifact-parity` (OMN-16888, plan §2.3 row 5).
 *
 * | | |
 * |---|---|
 * | **In scope** | compiled outputs — `tokens.css`, `tokens.ts`, the Tailwind `@theme` artifact, the generated TS mirror |
 * | **A violation is** | the artifact differs from a fresh compile of its declared source |
 * | **Out of scope** | nothing |
 *
 * **This is the rule that makes the other four durable.** Without it a compiled
 * artifact can be hand-patched and every other rule still passes.
 *
 * **What this rule can and cannot do, stated plainly.** ESLint sees one file at
 * a time, synchronously, with no build graph. It cannot re-run a Python emitter
 * or a TypeScript compiler to produce the bytes it would compare against. So
 * the byte comparison lives where it can actually run:
 *
 * - `npm run check:tokens` recompiles the token artifacts **from source** and
 *   compares bytes. It is in the required `build` job. (Demonstrated firing on
 *   CI under OMN-16886.)
 * - `src/generated/mirror-freshness.test.ts` checks the mirror. It is in the
 *   required `test` job.
 * - `npm run check:generated` walks the whole repo, every extension, for files
 *   carrying the banner and requires each to be declared. ESLint has no CSS
 *   language, so the compiled `.css` artifacts are invisible to this rule and
 *   would otherwise be the one class of generated file nothing covered.
 *
 * What this rule closes is the gap those two cannot see: **a generated artifact
 * that no parity checker covers.** A file carrying the GENERATED banner but
 * absent from `generated-artifacts.json` is unre-derivable by construction, and
 * an unre-derivable artifact is a hand-patchable one. Both directions are
 * errors — an undeclared generated file, and a declared artifact that lost its
 * banner (which is how a generated file quietly becomes a hand-maintained one).
 *
 * Saying "the byte check is elsewhere" in the rule itself is deliberate.
 * Pretending an ESLint rule performs a comparison it structurally cannot is how
 * a gate becomes decorative, which is the failure mode this whole plan is
 * written against.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { declaredFor, hasBanner } from './manifest.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Every generated artifact is declared with a parity checker that can re-derive it.',
    },
    schema: [],
    messages: {
      undeclared:
        "'{{file}}' carries the GENERATED banner but is not declared in " +
        'eslint-rules/generated-artifacts.json. An artifact no parity checker covers can be ' +
        'hand-patched while every other token rule still passes — which is the exact hole this ' +
        'rule exists to close. Declare it with its source and its parity checker.',
      bannerless:
        "'{{file}}' is declared as a generated artifact but no longer carries the GENERATED " +
        'banner. That is how a generated file quietly becomes a hand-maintained one. Regenerate ' +
        'it with `{{regenerate}}`.',
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename.startsWith(REPO_ROOT)) return {};
    // A test that asserts on the banner string is not an artifact carrying one.
    if (/\.(test|spec|stories)\.[cm]?[jt]sx?$/.test(filename)) return {};
    const repoRelative = relative(REPO_ROOT, filename).split(sep).join('/');

    const declared = declaredFor(repoRelative);

    let text;
    try {
      text = readFileSync(filename, 'utf8');
    } catch {
      return {};
    }
    const banner = hasBanner(text);

    return {
      Program(node) {
        if (banner && declared === undefined) {
          context.report({ node, messageId: 'undeclared', data: { file: repoRelative } });
          return;
        }
        if (!banner && declared !== undefined) {
          context.report({
            node,
            messageId: 'bannerless',
            data: { file: repoRelative, regenerate: declared.regenerate },
          });
        }
      },
    };
  },
};

export default rule;
