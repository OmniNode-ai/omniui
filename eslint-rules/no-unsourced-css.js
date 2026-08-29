// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `no-unsourced-css` (OMN-16888, plan §2.3 row 3).
 *
 * | | |
 * |---|---|
 * | **In scope** | `.css.ts` authored by hand, and template-literal CSS inside `.ts`/`.tsx` |
 * | **A violation is** | a colour or spacing literal not defined as, or referencing, a token custom property |
 * | **Out of scope** | the compiled `tokens.css` artifact itself, and everything under `src/generated/` |
 *
 * **The split, stated rather than hidden.** The plan's scope column says
 * "`.css` / `.css.ts`". ESLint 9.17 has no CSS language support, so a rule
 * cannot parse a `.css` file — it would have to lex CSS inside a JavaScript
 * parser, which is how a rule acquires its own bug surface. This rule therefore
 * covers the half ESLint can genuinely see (`.css.ts` and CSS written as
 * template literals in TypeScript), and `scripts/check-css-tokens.ts` covers
 * raw `.css` files. Both run inside the required `build` job, so the *scope* is
 * whole even though the *mechanism* is two pieces.
 */

import { containsColorLiteral, hasExemption, isRawSpacingLength, isTokenReference } from './shared.js';

/** A CSS declaration inside a template literal: `prop: value;`. */
const CSS_DECLARATION = /([-a-z]+)\s*:\s*([^;{}]+)[;}]/gi;

/** Declarations whose value is a colour. */
const COLOR_DECLARATION =
  /^(color|background|background-color|border(-[a-z]+)?-color|outline-color|fill|stroke|stop-color|box-shadow|text-shadow|border|outline)$/i;

/** Declarations whose value is layout spacing. */
const SPACING_DECLARATION =
  /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|width|height|inline-size|block-size)(-[a-z]+)*$/i;

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Hand-authored CSS resolves colour and spacing from token custom properties.',
    },
    schema: [],
    messages: {
      unsourced:
        "CSS declaration '{{property}}: {{value}}' is not sourced from a token. Reference the " +
        'compiled custom property instead — var(--onex-...). A value defined here is a second ' +
        'source of truth for something the theme catalog already owns.',
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    // Generated artifacts are governed by `generated-artifact-parity`, not by
    // this rule; they are supposed to contain literal values.
    if (filename.includes('/generated/') || filename.includes('\\generated\\')) {
      return {};
    }

    /**
     * @param {import('estree').Node} node
     * @param {string} raw
     */
    function scanCss(node, raw) {
      CSS_DECLARATION.lastIndex = 0;
      let match;
      while ((match = CSS_DECLARATION.exec(raw)) !== null) {
        const property = match[1];
        const value = (match[2] ?? '').trim();
        if (isTokenReference(value)) continue;

        const colourViolation = COLOR_DECLARATION.test(property) && containsColorLiteral(value);
        const spacingViolation =
          SPACING_DECLARATION.test(property) &&
          value.split(/\s+/).some((part) => isRawSpacingLength(part));
        if (!colourViolation && !spacingViolation) continue;
        if (hasExemption(context, node)) continue;

        context.report({ node, messageId: 'unsourced', data: { property, value } });
      }
    }

    return {
      TemplateLiteral(node) {
        const raw = node.quasis.map((quasi) => quasi.value.raw).join(' ');
        if (!raw.includes(':')) return;
        scanCss(node, raw);
      },

      Literal(node) {
        if (!filename.endsWith('.css.ts')) return;
        if (typeof node.value !== 'string') return;
        if (!node.value.includes(':')) return;
        scanCss(node, node.value);
      },
    };
  },
};

export default rule;
