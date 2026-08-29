// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `no-color-inline` (OMN-16888, plan §2.3 row 1).
 *
 * | | |
 * |---|---|
 * | **In scope** | `.tsx`/`.jsx` — `style={{}}` objects, `className` string literals containing colour values, props typed as colours |
 * | **A violation is** | any colour literal (hex, `rgb()`, `hsl()`, named CSS colour) that is not a reference to a compiled token |
 * | **Out of scope** | colours inside the compiled token module; test fixtures and stories carrying the declared exemption comment |
 *
 * This rule's shape is copied from `omnidash/eslint-rules/no-typography-inline.cjs`,
 * which is the repo's own proof that the enforcement model works: typography is
 * the one consistent axis in that app *precisely because it is the one enforced
 * axis*. Colour is the axis with 145 unreferenced hex literals and no gate.
 */

import {
  COLOR_PROPERTIES,
  containsColorLiteral,
  hasExemption,
  isChartPaintKey,
  isColorLiteral,
  isTokenReference,
} from './shared.js';

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Colour values resolve from the active theme instance, never from a literal in component code.',
    },
    schema: [],
    messages: {
      colorLiteral:
        "'{{property}}' pins the colour literal '{{value}}'. Resolve it from the active theme " +
        "instead: tokenRef('color_...'), which compiles to var(--onex-color-...). A literal " +
        'here cannot be changed by activating a different theme, which is the drift G-U1 detects.',
      classNameColor:
        "className contains the colour literal '{{value}}'. A colour smuggled through a class " +
        'string is still a colour the theme cannot move.',
    },
  },

  create(context) {
    /**
     * @param {import('estree').Node} node
     * @param {string} property
     * @param {string} value
     */
    function reportIfColor(node, property, value) {
      if (isTokenReference(value)) return;
      if (!containsColorLiteral(value)) return;
      if (hasExemption(context, node)) return;
      context.report({ node, messageId: 'colorLiteral', data: { property, value } });
    }

    return {
      Property(node) {
        if (node.computed) return;
        const key =
          node.key.type === 'Identifier'
            ? node.key.name
            : node.key.type === 'Literal'
              ? String(node.key.value)
              : undefined;
        if (key === undefined) return;
        // Chart and SVG paint belong to `svg-and-chart-inputs`. Reporting the
        // same literal from two rules is noise, and noise is what earns a rule
        // a blanket disable comment.
        if (isChartPaintKey(key)) return;

        // A colour-typed property with any literal value, or ANY property whose
        // value is unmistakably a colour. The second half catches
        // `seriesColor: '#f00'` on a config object with no styling name.
        const valueIsLiteralString =
          node.value.type === 'Literal' && typeof node.value.value === 'string';
        if (!valueIsLiteralString) return;
        const value = String(node.value.value);

        if (COLOR_PROPERTIES.has(key)) {
          reportIfColor(node.value, key, value);
          return;
        }
        if (isColorLiteral(value)) {
          reportIfColor(node.value, key, value);
        }
      },

      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        const name = node.name.name;
        if (isChartPaintKey(name)) return;
        if (node.value === null || node.value === undefined) return;

        if (name === 'className' && node.value.type === 'Literal') {
          const value = String(node.value.value);
          if (containsColorLiteral(value) && !hasExemption(context, node)) {
            context.report({ node: node.value, messageId: 'classNameColor', data: { value } });
          }
          return;
        }

        if (COLOR_PROPERTIES.has(name) && node.value.type === 'Literal') {
          reportIfColor(node.value, name, String(node.value.value));
        }
      },
    };
  },
};

export default rule;
