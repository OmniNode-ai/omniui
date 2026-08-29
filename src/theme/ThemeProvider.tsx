// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The theme binding (OMN-16885, Phase 1A.1).
 *
 * Plan §2.5 lists exactly one thing under "BUILD NEW, and it is small": the
 * theme binding — the seam where the library accepts a theme instance and
 * resolves component styling from it. `ModelRendererThemeContract` has had
 * zero runtime consumers since it shipped (plan §1.4); this is the first one.
 *
 * The provider is pure: it holds no state across renders, fetches nothing, and
 * loads nothing. A host resolves a theme instance from the catalog by whatever
 * transport that host uses and passes the result in, exactly as
 * `ProtocolRenderer` requires of anything calling itself a renderer.
 */

import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { themeToCssProperties } from './css-variables.js';
import { assertReportableTheme, type Theme } from './theme-token-set.js';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  /** The resolved theme instance the host activated. */
  readonly theme: Theme;
  /** Subtree that renders against this theme. */
  readonly children?: ReactNode;
  /**
   * Element type to render the token scope on. Defaults to `div`; a host that
   * owns its own layout root can pass `'section'`, `'main'`, and so on.
   */
  readonly as?: keyof globalThis.HTMLElementTagNameMap;
  /** Extra class names for the scope element. */
  readonly className?: string;
}

/**
 * Publish a theme's token values as CSS custom properties over a subtree.
 *
 * Every descendant resolves colours and lengths through `var(--onex-*)`, so
 * activating a different instance changes every rendered value with no
 * component rerender logic and no component-held colour.
 *
 * @param props - The theme to publish and the subtree to publish it over.
 * @returns The scope element wrapping `children`.
 */
export function ThemeProvider({
  theme,
  children,
  as = 'div',
  className,
}: ThemeProviderProps): ReactNode {
  assertReportableTheme(theme);

  const style = useMemo<CSSProperties>(
    () => themeToCssProperties(theme) as CSSProperties,
    [theme],
  );

  return createElement(
    ThemeContext.Provider,
    { value: theme },
    createElement(
      as,
      {
        'data-onex-theme': theme.identity.themeId,
        'data-onex-theme-revision': theme.identity.instanceRevision,
        'data-onex-theme-digest': theme.identity.contentDigest,
        ...(className === undefined ? {} : { className }),
        style,
      },
      children,
    ),
  );
}

/**
 * Read the active theme.
 *
 * @returns The theme published by the nearest `ThemeProvider`.
 * @throws {Error} If called outside a `ThemeProvider`. An unthemed component
 *   would have to invent a value, and an invented value is exactly the drift
 *   G-U1 exists to detect — so this fails rather than falling back.
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error(
      'useTheme() called outside a <ThemeProvider>. Components resolve every ' +
        'visual value from an activated theme instance; there is no default.',
    );
  }
  return theme;
}
