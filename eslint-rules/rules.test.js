// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * G1A.4 — token purity, both halves (OMN-16888).
 *
 * > **Passes when:** the rules pass in the new repo, with their scopes and
 * > exemptions declared in the rule config rather than in a reviewer's head.
 * > **Falsified by:** adding one in-scope literal must fail the build; an
 * > out-of-scope value (an SVG `viewBox`, a `1px` hairline) must **not**.
 *
 * Both halves are equally load-bearing, so every rule below has `invalid` cases
 * (the literal is caught) **and** `valid` cases (the out-of-scope value is left
 * alone). A rule that fires on the hairline is as broken as one that misses the
 * hex — the first gets an allowlist, then gets turned off, which is exactly how
 * detection-without-enforcement dies.
 */

import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import generatedArtifactParity from './generated-artifact-parity.js';
import noColorInline from './no-color-inline.js';
import noSpacingInline from './no-spacing-inline.js';
import noUnsourcedCss from './no-unsourced-css.js';
import svgAndChartInputs from './svg-and-chart-inputs.js';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run('no-color-inline', noColorInline, {
  valid: [
    // The sanctioned form.
    "const s = { color: tokenRef('color_text_primary') };",
    "const s = { backgroundColor: 'var(--onex-color-background-primary)' };",
    // Context-resolved keywords pin no value.
    "const s = { color: 'transparent' };",
    "const s = { color: 'currentColor' };",
    "const s = { color: 'inherit' };",
    // Not a colour at all.
    "const s = { display: 'flex' };",
    // Chart and SVG paint belong to `svg-and-chart-inputs`; this rule defers so
    // one literal is never reported twice.
    "const cfg = { axisColor: '#94a3b8' };",
    "const el = <rect fill='#ef4444' />;",
    "const s = { fontFamily: 'var(--onex-font-family-base)' };",
    // A className with no colour in it.
    'const el = <div className="widget-body" />;',
    // The declared exemption, with a reason.
    [
      'const t = {',
      '  // onex-token-exempt: asserting the compiler refuses a colliding token name',
      "  tokens: { 'color-accent-primary': '#000000' },",
      '};',
    ].join('\n'),
  ],
  invalid: [
    {
      code: "const s = { color: '#6366f1' };",
      errors: [{ messageId: 'colorLiteral' }],
    },
    {
      code: "const s = { backgroundColor: 'rgb(15, 23, 42)' };",
      errors: [{ messageId: 'colorLiteral' }],
    },
    {
      code: "const s = { color: 'rebeccapurple' };",
      errors: [{ messageId: 'colorLiteral' }],
    },
    {
      // A colour smuggled inside a shorthand.
      code: "const s = { border: '1px solid #334155' };",
      errors: [{ messageId: 'colorLiteral' }],
    },
    {
      // A colour on a key with no styling name at all.
      code: "const cfg = { brandTint: '#ff0000' };",
      errors: [{ messageId: 'colorLiteral' }],
    },
    {
      code: 'const el = <div className="bg-[#0f172a]" />;',
      errors: [{ messageId: 'classNameColor' }],
    },
    {
      // An exemption with no reason is not an exemption.
      code: ['// onex-token-exempt:', "const s = { color: '#6366f1' };"].join('\n'),
      errors: [{ messageId: 'colorLiteral' }],
    },
  ],
});

tester.run('no-spacing-inline', noSpacingInline, {
  valid: [
    "const s = { padding: tokenRef('spacing_md') };",
    "const s = { gap: 'var(--onex-spacing-sm)' };",
    // Out of scope by name in the plan: hairline, zero, auto, relative units.
    "const s = { borderWidth: '1px' };",
    "const s = { padding: '1px' };",
    "const s = { margin: '0' };",
    "const s = { width: 'auto' };",
    "const s = { width: '100%' };",
    "const s = { height: '50vh' };",
    "const s = { inlineSize: '100%' };",
    // Not a spacing property.
    "const s = { fontSize: '0.875rem' };",
    "const s = { lineHeight: '1.5rem' };",
    // An SVG coordinate system, not a layout.
    "const el = <rect width='120' height='40' />;",
    [
      '// onex-token-exempt: the raw length is the fixture under test',
      "const s = { padding: '13px' };",
    ].join('\n'),
  ],
  invalid: [
    { code: "const s = { padding: '12px' };", errors: [{ messageId: 'rawSpacing' }] },
    { code: "const s = { gap: '0.75rem' };", errors: [{ messageId: 'rawSpacing' }] },
    { code: "const s = { marginTop: '2em' };", errors: [{ messageId: 'rawSpacing' }] },
    { code: "const s = { inlineSize: '2rem' };", errors: [{ messageId: 'rawSpacing' }] },
  ],
});

tester.run('svg-and-chart-inputs', svgAndChartInputs, {
  valid: [
    // Geometry is coordinates, not design tokens. This is the half of G1A.4
    // that a noisy rule fails.
    "const el = <svg viewBox='0 0 100 100' />;",
    "const el = <path d='M0 0 L10 10' strokeWidth='2' />;",
    "const el = <circle cx='50' cy='50' r='20' />;",
    "const el = <g transform='translate(4, 8)' />;",
    // Theme-resolved paint.
    "const cfg = { seriesColor: 'var(--onex-color-accent-primary)' };",
    "const cfg = { colors: [tokenRef('color_accent_primary')] };",
    // A key that is not paint.
    "const cfg = { colorSpace: 'srgb' };",
  ],
  invalid: [
    {
      code: "const cfg = { axisColor: '#94a3b8' };",
      errors: [{ messageId: 'paintLiteral' }],
    },
    {
      code: "const cfg = { gridColor: 'rgba(0,0,0,0.2)' };",
      errors: [{ messageId: 'paintLiteral' }],
    },
    {
      code: "const cfg = { palette: ['#6366f1', '#818cf8'] };",
      errors: [{ messageId: 'paletteLiteral' }, { messageId: 'paletteLiteral' }],
    },
    {
      code: "const el = <rect fill='#ef4444' />;",
      errors: [{ messageId: 'paintLiteral' }],
    },
    {
      code: "const cfg = { thresholdColors: ['crimson'] };",
      errors: [{ messageId: 'paletteLiteral' }],
    },
  ],
});

tester.run('no-unsourced-css', noUnsourcedCss, {
  valid: [
    'const css = `.tile { color: var(--onex-color-text-primary); }`;',
    'const css = `.tile { padding: var(--onex-spacing-md); }`;',
    // Out of scope: geometry, and values the theme does not own.
    'const css = `.tile { border-width: 1px; }`;',
    'const css = `.tile { width: 100%; }`;',
    'const css = `.tile { margin: 0; }`;',
    // Not CSS at all.
    'const label = `total: ${count}`;',
    [
      '// onex-token-exempt: a literal CSS fixture asserted on by the checker test',
      'const css = `.tile { color: #ff0000; }`;',
    ].join('\n'),
  ],
  invalid: [
    {
      code: 'const css = `.tile { color: #f8fafc; }`;',
      errors: [{ messageId: 'unsourced' }],
    },
    {
      code: 'const css = `.tile { background-color: hsl(220 40% 12%); }`;',
      errors: [{ messageId: 'unsourced' }],
    },
    {
      code: 'const css = `.tile { padding: 12px; }`;',
      errors: [{ messageId: 'unsourced' }],
    },
  ],
});

tester.run('generated-artifact-parity', generatedArtifactParity, {
  // This rule reads the file off disk to inspect its banner, so RuleTester's
  // in-memory sources exercise only the "no banner, not declared" path. The
  // reporting paths are covered by `eslint-rules/parity.test.js`, which writes
  // real files — an honest split rather than a mocked assertion.
  valid: ['const x = 1;'],
  invalid: [],
});
