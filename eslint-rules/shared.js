// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Shared detection for the five scoped semantic-token rules (OMN-16888).
 *
 * Every predicate here exists to make a rule's *scope* mechanical. The earlier
 * blanket phrasing — "no raw px, no hex anywhere" — was unenforceable because
 * it declared no scope, so every SVG `viewBox` integer and every generated file
 * was a false positive waiting to happen. A rule that cries wolf gets an
 * allowlist, then gets ignored; that is Operating Rule #5's failure mode.
 *
 * G1A.4 has two halves and they are equally load-bearing: an in-scope literal
 * must fail the build, **and** an out-of-scope value must not. A rule that
 * fires on a `1px` hairline is as broken as one that misses the hex.
 */

/** `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** `rgb()`, `hsl()`, `oklch()`, `color-mix()`, and the rest of the function forms. */
const FUNCTIONAL_COLOR =
  /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk)\s*\(/i;

/**
 * Named CSS colors.
 *
 * Deliberately the full set rather than a popular subset: a rule that catches
 * `red` and misses `rebeccapurple` teaches people which literals are safe to
 * smuggle, which is worse than no rule. `transparent` and `currentColor` are
 * excluded — they resolve from context and pin no value.
 */
const NAMED_COLORS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue ' +
    'blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk ' +
    'crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki ' +
    'darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue ' +
    'dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite ' +
    'gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki ' +
    'lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen ' +
    'lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen ' +
    'magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
    'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream ' +
    'mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
    'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
    'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown ' +
    'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen ' +
    'steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

/** A `var(--onex-*)` reference: the only sanctioned way to name a value. */
const TOKEN_VAR_REF = /var\(\s*--onex-[a-z0-9-]+/i;

/** Raw absolute lengths a spacing token could have expressed. */
const RAW_LENGTH = /^-?\d*\.?\d+(px|rem|em)$/;

/**
 * Lengths that are geometry, not spacing, and are explicitly out of scope.
 *
 * `1px` is the hairline the plan names by hand. `0` and `auto` pin no scale
 * step. Percentages and viewport units are relative to something the theme does
 * not own.
 */
const OUT_OF_SCOPE_LENGTH = /^(?:0|auto|1px|-?\d*\.?\d+(?:%|vh|vw|vmin|vmax|dvh|dvw|svh|lvh|ch|ex|fr))$/;

/** Style properties that express layout spacing. */
const SPACING_PROPERTIES = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingBlock', 'paddingBlockStart', 'paddingBlockEnd',
  'paddingInline', 'paddingInlineStart', 'paddingInlineEnd',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginBlock', 'marginBlockStart', 'marginBlockEnd',
  'marginInline', 'marginInlineStart', 'marginInlineEnd',
  'gap', 'rowGap', 'columnGap',
  'inset', 'insetBlock', 'insetInline',
  'top', 'right', 'bottom', 'left',
  'width', 'height', 'inlineSize', 'blockSize',
  'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
]);

/**
 * Style/JSX properties whose value is a colour.
 *
 * The SVG paint props (`fill`, `stroke`, `stopColor`, ...) are deliberately
 * NOT here: the plan assigns them to `svg-and-chart-inputs`, and a literal
 * reported by two rules at once is noise, which is how a rule earns a blanket
 * disable comment. The two rules partition the space; they do not overlap.
 */
const COLOR_PROPERTIES = new Set([
  'color', 'backgroundColor', 'background', 'borderColor', 'borderTopColor',
  'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor',
  'caretColor', 'textDecorationColor', 'columnRuleColor', 'accentColor',
  'boxShadow', 'textShadow', 'borderTop', 'borderRight', 'borderBottom',
  'borderLeft', 'border', 'outline',
]);

/**
 * Config keys that carry chart or SVG paint — `svg-and-chart-inputs`' half of
 * the partition. `no-color-inline` defers on these.
 *
 * Deliberately does NOT match the bare CSS property names `color`, `fill`, or
 * `stroke`. `color` is a style property and belongs to `no-color-inline`;
 * `fill` and `stroke` are SVG paint and are matched through
 * `SVG_PAINT_PROPERTIES` instead.
 *
 * The camelCase suffix also matches real CSS properties — `backgroundColor`,
 * `borderColor`, `accentColor` — so `isChartPaintKey` checks
 * `COLOR_PROPERTIES` FIRST. A known CSS colour property is never a chart config
 * key, and getting that precedence backwards turns the partition into a gap
 * that reports nothing at all.
 */
const CHART_COLOR_KEY =
  /[a-z](?:Colors?|Palette|Swatch(?:es)?|Fill|Stroke)$|^(?:colors|palette|swatch(?:es)?)$/;

/** SVG and chart props feeding a paint operation. */
const SVG_PAINT_PROPERTIES = new Set([
  'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor',
]);

/**
 * SVG properties that are coordinates, not design tokens.
 *
 * Gating these produces noise with no drift signal, which is why the plan puts
 * them out of scope by name.
 */
const SVG_GEOMETRY_PROPERTIES = new Set([
  'viewBox', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'points', 'transform', 'strokeWidth', 'strokeDasharray', 'strokeDashoffset',
  'pathLength', 'dx', 'dy', 'offset', 'width', 'height',
]);

/**
 * Does this key feed chart or SVG paint rather than a CSS colour property?
 *
 * @param {string} key - The property name.
 * @returns {boolean} True when `svg-and-chart-inputs` owns this key.
 */
function isChartPaintKey(key) {
  if (SVG_PAINT_PROPERTIES.has(key)) return true;
  if (COLOR_PROPERTIES.has(key)) return false;
  return CHART_COLOR_KEY.test(key);
}

/**
 * Does this string pin a colour value?
 *
 * @param {string} value - The string to inspect.
 * @returns {boolean} True when the string is a colour literal.
 */
function isColorLiteral(value) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (HEX_COLOR.test(trimmed)) return true;
  if (FUNCTIONAL_COLOR.test(trimmed)) return true;
  return NAMED_COLORS.has(trimmed.toLowerCase());
}

/**
 * Does this string contain a colour literal anywhere inside it?
 *
 * Shorthand values (`1px solid #334155`, `0 1px 2px rgba(0,0,0,.4)`) pin a
 * colour just as hard as a bare hex does.
 *
 * @param {string} value - The string to inspect.
 * @returns {boolean} True when a colour literal appears anywhere in it.
 */
function containsColorLiteral(value) {
  if (isColorLiteral(value)) return true;
  if (/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i.test(value)) return true;
  if (/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\(/i.test(value)) return true;
  return value
    .split(/[\s,()]+/)
    .some((part) => NAMED_COLORS.has(part.trim().toLowerCase()));
}

/**
 * Does this string reference a compiled token?
 *
 * @param {string} value - The string to inspect.
 * @returns {boolean} True when the string resolves through `var(--onex-*)`.
 */
function isTokenReference(value) {
  return TOKEN_VAR_REF.test(value);
}

/**
 * Is this length a raw absolute value a spacing token could have expressed?
 *
 * @param {string} value - The string to inspect.
 * @returns {boolean} True when in scope for `no-spacing-inline`.
 */
function isRawSpacingLength(value) {
  const trimmed = value.trim();
  if (OUT_OF_SCOPE_LENGTH.test(trimmed)) return false;
  if (isTokenReference(trimmed)) return false;
  return RAW_LENGTH.test(trimmed);
}

/** The one sanctioned exemption marker. A reason after the colon is mandatory. */
const EXEMPTION = /onex-token-exempt:\s*\S+/;

/**
 * The declared exemption comment, and it must carry a reason.
 *
 * `// onex-token-exempt: <reason>` on the reported line, or anywhere in the
 * contiguous comment block immediately above it — so a reason may run to more
 * than one line without silently losing its force, which is the kind of
 * near-miss that teaches people the mechanism is unreliable.
 *
 * A reason is mandatory because an allowlist entry nobody can read is an
 * allowlist entry nobody can remove, and this allowlist only shrinks.
 *
 * @param {import('eslint').Rule.RuleContext} context - The rule context.
 * @param {import('estree').Node} node - The node being reported.
 * @returns {boolean} True when a valid exemption covers this node.
 */
function hasExemption(context, node) {
  const source = context.sourceCode ?? context.getSourceCode();
  const line = node.loc?.start.line;
  if (line === undefined) return false;

  /** @type {Map<number, string[]>} */
  const byEndLine = new Map();
  for (const comment of source.getAllComments()) {
    if (comment.loc === undefined) continue;
    for (let l = comment.loc.start.line; l <= comment.loc.end.line; l += 1) {
      const bucket = byEndLine.get(l) ?? [];
      bucket.push(comment.value);
      byEndLine.set(l, bucket);
    }
  }

  if ((byEndLine.get(line) ?? []).some((value) => EXEMPTION.test(value))) return true;

  // Walk up through the contiguous comment block directly above the node.
  for (let l = line - 1; byEndLine.has(l); l -= 1) {
    if ((byEndLine.get(l) ?? []).some((value) => EXEMPTION.test(value))) return true;
  }
  return false;
}

export {
  CHART_COLOR_KEY,
  COLOR_PROPERTIES,
  isChartPaintKey,
  SPACING_PROPERTIES,
  SVG_GEOMETRY_PROPERTIES,
  SVG_PAINT_PROPERTIES,
  containsColorLiteral,
  hasExemption,
  isColorLiteral,
  isRawSpacingLength,
  isTokenReference,
};
