// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The icon vocabulary (OMN-16935, Phase 1B.1).
 *
 * Gate G1B.2 requires every severity to be *"distinguishable by text and icon
 * with colour removed"*. That makes the icon a load-bearing carrier of meaning,
 * not decoration, and three consequences follow:
 *
 * 1. **Shapes are genuinely distinct** — an octagon, a triangle, a circle, a
 *    diamond. Four glyphs that differ only in hue would satisfy the letter of
 *    the gate and none of its purpose, and a monochrome screenshot is exactly
 *    where the board gets read.
 * 2. **An unknown identifier throws.** A contract naming an icon this library
 *    does not have is a contract this library cannot render honestly; rendering
 *    a blank box would make a critical tile look like a decorative one.
 * 3. **Colour comes from the caller**, always as `currentColor`, so the glyph
 *    inherits whatever theme token the surrounding element resolved. The icon
 *    module names no colour at all.
 */

import type { ReactNode } from 'react';

/** Every icon this library can draw. Extending it is a deliberate act. */
const ICON_PATHS: ReadonlyMap<string, string> = new Map([
  // Severity glyphs. Chosen so the silhouettes differ, not just the strokes.
  ['octagon-alert', 'M7.2 1.5h9.6L22.5 7.2v9.6L16.8 22.5H7.2L1.5 16.8V7.2ZM12 7v6M12 16.5v.5'],
  ['triangle-alert', 'M12 2.5 22.5 21H1.5ZM12 9.5v5M12 17.5v.5'],
  ['circle-check', 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19ZM7.5 12.2l3 3 6-6.4'],
  ['question-diamond', 'M12 1.5 22.5 12 12 22.5 1.5 12ZM9.6 9.4a2.4 2.4 0 1 1 2.9 2.7v1.6M12 17.2v.4'],
  // Empty-state glyphs.
  ['slash-circle', 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19ZM5.3 5.3l13.4 13.4'],
  ['column-missing', 'M3 4h18v16H3ZM9 4v16M15 4v16M9.8 9.8l4.4 4.4M14.2 9.8l-4.4 4.4'],
  ['plug-off', 'M8 2v6M16 2v6M5.5 8h13v3a6.5 6.5 0 0 1-13 0ZM12 17.5V22M3 3l18 18'],
  ['file-invalid', 'M6 2h8l4 4v16H6ZM14 2v4h4M9.5 12l5 5M14.5 12l-5 5'],
  // Monitored-thing glyphs, for a tile's own optional icon.
  ['queue', 'M3 6h18M3 12h18M3 18h12'],
  ['chain', 'M9.5 14.5 7 17a3.5 3.5 0 0 1-5-5l2.5-2.5M14.5 9.5 17 7a3.5 3.5 0 0 1 5 5l-2.5 2.5M8.5 15.5l7-7'],
]);

export interface IconProps {
  /** Icon identifier, as named by a contract or by an empty-state reason. */
  readonly name: string;
  /** Accessible name. Pass `null` when adjacent text already names the thing. */
  readonly title?: string | null;
  /** Edge length, as a token reference or a unitless number of pixels. */
  readonly size?: number;
}

/**
 * Draw one glyph.
 *
 * @param props - Which glyph, how big, and what to call it.
 * @returns An inline SVG that inherits its colour from the caller.
 * @throws {Error} If the identifier is not in the vocabulary.
 */
export function Icon({ name, title = null, size = 16 }: IconProps): ReactNode {
  const path = ICON_PATHS.get(name);
  if (path === undefined) {
    throw new Error(
      `icon '${name}' is not in the vocabulary (have: ${[...ICON_PATHS.keys()].join(', ')}). ` +
        'A missing glyph is not rendered blank: on a health board a blank is ' +
        'indistinguishable from nominal, and G1B.2 forbids exactly that.',
    );
  }
  return (
    <svg
      data-onex-icon={name}
      role={title === null ? 'presentation' : 'img'}
      aria-hidden={title === null}
      aria-label={title ?? undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title === null ? null : <title>{title}</title>}
      <path d={path} />
    </svg>
  );
}

/**
 * Is this identifier drawable?
 *
 * Exposed so a contract fixture can be validated against the vocabulary in a
 * test rather than discovered at render time by a component throwing.
 *
 * @param name - The identifier to check.
 * @returns True when the glyph exists.
 */
export function hasIcon(name: string): boolean {
  return ICON_PATHS.has(name);
}
