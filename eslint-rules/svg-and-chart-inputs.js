// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `svg-and-chart-inputs` (OMN-16888, plan §2.3 row 4).
 *
 * | | |
 * |---|---|
 * | **In scope** | props and config objects feeding SVG elements and chart renderers — `fill`, `stroke`, `stopColor`, series colour arrays, axis/grid/threshold colours |
 * | **A violation is** | a colour supplied as a literal instead of resolved from the theme binding |
 * | **Out of scope** | geometric SVG values — `viewBox`, `d`, `cx/cy/r`, `strokeWidth`, transforms. These are coordinates, not design tokens, and gating them produces noise with no drift signal |
 *
 * This rule exists separately from `no-color-inline` because chart colour does
 * not arrive as a style property. It arrives as `series: [{ color: '#6366f1' }]`
 * and as `axisColor`, `gridColor`, `thresholdColors` — config shapes that a
 * style-property rule never sees. omnidash's 3,996 lines of forked trend charts
 * are exactly where those literals live.
 */

import {
  SVG_GEOMETRY_PROPERTIES,
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
        'SVG and chart paint resolves from the theme binding, never from a colour literal.',
    },
    schema: [],
    messages: {
      paintLiteral:
        "'{{property}}' supplies the colour literal '{{value}}' to a chart or SVG paint input. " +
        'Resolve it from the theme binding instead. A chart whose series colours are literals ' +
        'renders the same hues under every theme, which is the drift this rule exists to find.',
      paletteLiteral:
        "'{{property}}' contains the colour literal '{{value}}' in a palette array. A palette is " +
        'a theme decision; a literal array is that decision made once, in the wrong place.',
    },
  },

  create(context) {
    /**
     * @param {import('estree').Node} node
     * @param {string} property
     * @param {string} value
     * @param {'paintLiteral' | 'paletteLiteral'} messageId
     */
    function report(node, property, value, messageId) {
      if (isTokenReference(value)) return;
      if (hasExemption(context, node)) return;
      context.report({ node, messageId, data: { property, value } });
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
        // Coordinates are not design tokens. Reporting them is how a rule gets
        // an allowlist and then gets ignored.
        if (SVG_GEOMETRY_PROPERTIES.has(key)) return;
        if (!isChartPaintKey(key)) return;

        if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
          const value = String(node.value.value);
          if (containsColorLiteral(value)) {
            report(node.value, key, value, 'paintLiteral');
          }
          return;
        }

        if (node.value.type === 'ArrayExpression') {
          for (const element of node.value.elements) {
            if (
              element !== null &&
              element.type === 'Literal' &&
              typeof element.value === 'string' &&
              isColorLiteral(String(element.value))
            ) {
              report(element, key, String(element.value), 'paletteLiteral');
            }
          }
        }
      },

      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        const name = node.name.name;
        if (SVG_GEOMETRY_PROPERTIES.has(name)) return;
        if (!isChartPaintKey(name)) return;
        if (node.value === null || node.value === undefined) return;
        if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') return;
        const value = String(node.value.value);
        if (!containsColorLiteral(value)) return;
        report(node.value, name, value, 'paintLiteral');
      },
    };
  },
};

export default rule;
