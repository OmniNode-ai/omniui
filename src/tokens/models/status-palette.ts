// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The typed loader for `themes/status-palette.json` (OMN-21848).
 *
 * The palette is data in one place; no colour literal lives in this file. The
 * loader validates the shape and refuses anything the artifact could not
 * render, so a malformed palette fails the build rather than the page.
 *
 * Pure and framework-free: nothing here imports a UI library.
 */

/** The six semantic status names, in emission order. */
export const STATUS_NAMES = ['moving', 'waiting', 'blocked', 'stopped', 'unread', 'stale'] as const;

export type StatusName = (typeof STATUS_NAMES)[number];

export interface StatusEntry {
  /** Colour on the light theme surface. */
  readonly light: string;
  /** Colour on the dark theme surface. */
  readonly dark: string;
  /** Stable icon token, so colour is never the only signal. */
  readonly icon: string;
  /** The icon id the token maps to. */
  readonly icon_id: string;
}

export interface StatusPalette {
  readonly palette_version: string;
  /** Theme id of the light and of the dark instance the colours sit on. */
  readonly themes: { readonly light: string; readonly dark: string };
  /** The theme token that names the surface a status colour must contrast with. */
  readonly surface_token: string;
  readonly statuses: Readonly<Record<StatusName, StatusEntry>>;
}

const HEX_COLOUR = /^#[0-9a-f]{6}$/;
const ICON_TOKEN = /^status\.[a-z]+$/;
const ICON_ID = /^[a-z][a-z0-9-]*$/;

function record(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${where}: expected an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, where: string, shape?: RegExp): string {
  if (typeof value !== 'string' || (shape !== undefined && !shape.test(value))) {
    throw new TypeError(`${where}: expected a string${shape === undefined ? '' : ` matching ${String(shape)}`}`);
  }
  return value;
}

/**
 * Validate a parsed status palette.
 *
 * @param raw - The parsed JSON document.
 * @returns The palette, typed.
 * @throws {TypeError} If the shape, a name, a colour or an icon token is wrong,
 * or two statuses share an icon token.
 */
export function parseStatusPalette(raw: unknown): StatusPalette {
  const doc = record(raw, 'palette');
  const themes = record(doc.themes, 'palette.themes');
  const statusDoc = record(doc.statuses, 'palette.statuses');

  const unknown = Object.keys(statusDoc).filter((name) => !(STATUS_NAMES as readonly string[]).includes(name));
  if (unknown.length > 0) {
    throw new TypeError(`palette.statuses: unknown status ${unknown.join(', ')}`);
  }

  const statuses = {} as Record<StatusName, StatusEntry>;
  const icons = new Set<string>();
  for (const name of STATUS_NAMES) {
    const where = `palette.statuses.${name}`;
    const entry = record(statusDoc[name], where);
    const icon = text(entry.icon, `${where}.icon`, ICON_TOKEN);
    if (icons.has(icon)) {
      throw new TypeError(`${where}.icon: '${icon}' is shared with another status`);
    }
    icons.add(icon);
    statuses[name] = {
      light: text(entry.light, `${where}.light`, HEX_COLOUR),
      dark: text(entry.dark, `${where}.dark`, HEX_COLOUR),
      icon,
      icon_id: text(entry.icon_id, `${where}.icon_id`, ICON_ID),
    };
  }

  return {
    palette_version: text(doc.palette_version, 'palette.palette_version'),
    themes: {
      light: text(themes.light, 'palette.themes.light'),
      dark: text(themes.dark, 'palette.themes.dark'),
    },
    surface_token: text(doc.surface_token, 'palette.surface_token'),
    statuses,
  };
}
