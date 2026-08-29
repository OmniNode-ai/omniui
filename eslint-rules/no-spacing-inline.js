// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `no-spacing-inline` (OMN-16888, plan §2.3 row 2).
 *
 * | | |
 * |---|---|
 * | **In scope** | `.tsx`/`.jsx` — `padding`, `margin`, `gap`, `inset`, `top/right/bottom/left`, `width`/`height` when they express layout spacing |
 * | **A violation is** | a raw length literal (`px`, `rem`, `em`) where a spacing-scale token exists |
 * | **Out of scope** | geometry that is not spacing: `1px` hairlines, `100%`, `0`, `auto`, viewport units, and any length inside a chart/SVG coordinate system |
 *
 * The out-of-scope column is not politeness. G1A.4 is falsified **either** by a
 * missed literal **or** by a rule that fires on a hairline, and the second
 * failure is the one that gets a rule disabled.
 */

import {
  SPACING_PROPERTIES,
  SVG_GEOMETRY_PROPERTIES,
  hasExemption,
  isRawSpacingLength,
} from './shared.js';

/** Elements whose attributes are a coordinate system, not a layout. */
const SVG_ELEMENTS = new Set([
  'svg', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path',
  'g', 'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop',
  'clipPath', 'mask', 'pattern', 'use', 'image', 'foreignObject', 'marker',
]);

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Layout spacing comes from the theme spacing scale, never from a raw length literal.',
    },
    schema: [],
    messages: {
      rawSpacing:
        "'{{property}}' uses the raw length '{{value}}'. Use a spacing-scale token — " +
        "tokenRef('spacing_sm' | 'spacing_md' | ...) — so the scale stays one decision " +
        'instead of a hundred. Geometry that is not spacing (0, auto, 1px hairlines, ' +
        'percentages, viewport units, SVG coordinates) is out of scope and is not reported.',
    },
  },

  create(context) {
    /**
     * Is this node inside an SVG element's attributes?
     *
     * @param {import('estree').Node} node - The node under consideration.
     * @returns {boolean} True when the enclosing JSX element is an SVG element.
     */
    function insideSvgElement(node) {
      let current = /** @type {any} */ (node);
      while (current !== undefined && current !== null) {
        if (
          current.type === 'JSXOpeningElement' &&
          current.name?.type === 'JSXIdentifier' &&
          SVG_ELEMENTS.has(current.name.name)
        ) {
          return true;
        }
        current = current.parent;
      }
      return false;
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
        if (!SPACING_PROPERTIES.has(key)) return;
        // `width`/`height` on an SVG element are a coordinate system.
        if (SVG_GEOMETRY_PROPERTIES.has(key) && insideSvgElement(node)) return;
        if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') return;

        const value = String(node.value.value);
        if (!isRawSpacingLength(value)) return;
        if (hasExemption(context, node)) return;
        context.report({
          node: node.value,
          messageId: 'rawSpacing',
          data: { property: key, value },
        });
      },
    };
  },
};

export default rule;
