// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `StatusGrid` — the generic status-tile type (OMN-16936, Phase 1B.2).
 *
 * One component type, configured by `ModelWidgetConfigStatusGrid` as extended
 * by Phase C3. The system-health board (D4) is an *instance* of it: an
 * envelope, a set of bindings, and a host that read them. There is no
 * board-specific code here and there must not be — a board-shaped `.tsx` is
 * exactly the bespoke-widget pattern the whole plan exists to end.
 *
 * **The grid maps severity to presentation. It never computes severity.**
 * Every tile carries a `ModelSeverityVerdict` decided upstream and traceable to
 * `policy_id` / `policy_version` / `policy_digest`. A client that thresholded a
 * projection itself would be inventing authoritative system state, which the
 * truth doctrine forbids, and would answer "why is this tile red?" with "because
 * of some code in a browser".
 *
 * **Three rules the rendering obeys, each with a failure it prevents:**
 *
 * 1. **A tile whose binding did not resolve renders its declared empty state,
 *    never its configured verdict.** A config-carried verdict is what upstream
 *    said *when the envelope was sealed*. If the read behind it failed now,
 *    showing it presents stale certainty as current fact — and if that verdict
 *    happened to be `nominal`, a broken read renders as health. That is the
 *    single worst thing a health board can do.
 * 2. **Severity is never carried by colour alone.** Every tile renders the
 *    severity's text label and its distinct glyph. G1B.2 is explicit, and the
 *    real reason is mundane: this board gets screenshotted into chat.
 * 3. **An absent number is "no reading", never `0`.** OMN-16777 AC5: `null`
 *    marks a window that was never observed, which is a different fact from a
 *    window observed to have carried nothing. Coercing one into the other
 *    reintroduces the false-green the projection exists to close.
 */

import type { ReactNode } from 'react';

import {
  resolveBinding,
  type BindingResolution,
  type HostDatasets,
} from '../binding/index.js';
import type {
  EnumStatusSeverity,
  ModelSeverityRole,
  ModelStatusItemConfig,
  ModelStatusSecondary,
  ModelWidgetConfigStatusGrid,
  ModelWidgetEnvelope,
} from '../generated/onex-models.js';
import { tokenRef } from '../theme/css-variables.js';

import { EmptyState } from './EmptyState.js';
import { Icon } from './Icon.js';

export interface StatusGridProps {
  /** A verified envelope whose `config_kind` is `status_grid`. */
  readonly envelope: ModelWidgetEnvelope;
  /** What the host read for each declared binding, keyed by `binding_id`. */
  readonly datasets: HostDatasets;
}

/**
 * Find the presentation the config declares for a severity.
 *
 * @param config - The grid config.
 * @param severity - The severity to present.
 * @returns The declared role.
 * @throws {Error} If the config declares no role for it. A tile whose severity
 *   has no declared presentation cannot be rendered legibly, and rendering it
 *   as a bare label would silently drop the distinction G1B.2 requires.
 */
function roleFor(
  config: ModelWidgetConfigStatusGrid,
  severity: EnumStatusSeverity,
): ModelSeverityRole {
  const role = (config.severity_roles ?? []).find((candidate) => candidate.severity === severity);
  if (role === undefined) {
    throw new Error(
      `status grid declares no severity role for '${severity}'. Every severity a ` +
        'tile can carry needs a label, an icon, and a theme token; a severity with ' +
        'no declared presentation is one a reader cannot tell apart.',
    );
  }
  return role;
}

/**
 * Render a tile's numeric secondary, or say there is no reading.
 *
 * @param secondary - The secondary, or `null`/absent.
 * @returns The rendered number, or the declared no-reading marker.
 */
function Secondary({
  secondary,
}: {
  readonly secondary: ModelStatusSecondary | null | undefined;
}): ReactNode {
  if (secondary === null || secondary === undefined) {
    return (
      <span
        data-onex-tile-secondary="none"
        style={{ color: tokenRef('color_text_disabled'), fontSize: tokenRef('font_size_sm') }}
      >
        No reading
      </span>
    );
  }
  return (
    <span
      data-onex-tile-secondary={secondary.kind}
      style={{ color: tokenRef('color_text_secondary'), fontSize: tokenRef('font_size_sm') }}
    >
      <span
        data-onex-tile-secondary-value
        style={{
          color: tokenRef('color_text_primary'),
          fontSize: tokenRef('font_size_lg'),
          fontWeight: tokenRef('font_weight_bold'),
        }}
      >
        {secondary.value.toLocaleString('en-US')}
      </span>
      {secondary.unit === null || secondary.unit === undefined ? null : (
        <span data-onex-tile-secondary-unit> {secondary.unit}</span>
      )}
      <span data-onex-tile-secondary-label> {secondary.label}</span>
    </span>
  );
}

/**
 * One tile: its name, what upstream said about it, and its number.
 *
 * @param props - The tile config, its declared role, and its binding result.
 * @returns The rendered tile.
 */
function StatusTile({
  item,
  role,
  resolution,
  showLabel,
  compact,
}: {
  readonly item: ModelStatusItemConfig;
  readonly role: ModelSeverityRole;
  readonly resolution: BindingResolution;
  readonly showLabel: boolean;
  readonly compact: boolean;
}): ReactNode {
  const frame = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokenRef('spacing_xs'),
    padding: compact ? tokenRef('spacing_sm') : tokenRef('spacing_md'),
    borderRadius: tokenRef('border_radius_md'),
    border: `1px solid ${tokenRef('color_border_default')}`,
    backgroundColor: tokenRef('color_background_secondary'),
    fontFamily: tokenRef('font_family_base'),
  };

  const heading = showLabel ? (
    <span
      data-onex-tile-label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokenRef('spacing_xs'),
        color: tokenRef('color_text_secondary'),
        fontSize: tokenRef('font_size_sm'),
      }}
    >
      {item.icon === null || item.icon === undefined ? null : <Icon name={item.icon} />}
      {item.label}
    </span>
  ) : null;

  // Rule 1. The verdict below is what upstream said when this envelope was
  // sealed; without a resolved read there is nothing to say it is still true.
  if (resolution.status === 'empty') {
    return (
      <div data-onex-tile={item.key} data-onex-tile-state="empty" style={frame}>
        {heading}
        <EmptyState reason={resolution.reason} detail={resolution.detail} compact />
      </div>
    );
  }

  return (
    <div
      data-onex-tile={item.key}
      data-onex-tile-state="resolved"
      data-onex-severity={item.verdict.severity}
      data-onex-status-value={item.verdict.status_value}
      style={frame}
    >
      {heading}
      <span
        data-onex-tile-severity
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: tokenRef('spacing_xs'),
          // The one place a severity's colour is applied, and it is resolved
          // from the theme by the token NAME the config declared.
          color: tokenRef(role.theme_color_token),
          fontWeight: tokenRef('font_weight_bold'),
        }}
      >
        <Icon name={role.icon} title={role.label} size={compact ? 14 : 18} />
        <span data-onex-severity-label>{role.label}</span>
        <span
          data-onex-status-text
          style={{ color: tokenRef('color_text_secondary'), fontWeight: tokenRef('font_weight_normal') }}
        >
          {item.verdict.status_value}
        </span>
      </span>
      <Secondary secondary={item.secondary} />
    </div>
  );
}

/**
 * Render a status grid from a widget envelope and the host's reads.
 *
 * @param props - The envelope and the host-supplied datasets.
 * @returns The rendered grid.
 * @throws {TypeError} If the envelope is not a status grid.
 * @throws {Error} If a tile has no matching binding, or a severity has no
 *   declared role.
 */
export function StatusGrid({ envelope, datasets }: StatusGridProps): ReactNode {
  const config = envelope.config as ModelWidgetConfigStatusGrid;
  if (config.config_kind !== 'status_grid') {
    throw new TypeError(
      `StatusGrid received a '${String(config.config_kind)}' config. The renderer ` +
        'gates on the declared kind rather than duck-typing the config, so a ' +
        'mis-routed envelope fails here instead of rendering something plausible.',
    );
  }

  const items = config.items ?? [];
  const bindings = envelope.component.data_bindings ?? [];
  const columns = config.columns ?? 3;
  const compact = config.compact ?? false;
  const showLabels = config.show_labels ?? true;

  if (items.length === 0) {
    return (
      <EmptyState
        reason="no-data"
        detail={`widget '${envelope.widget_id}' declares no status items`}
      />
    );
  }

  return (
    <div
      data-onex-widget={envelope.widget_id}
      data-onex-component-kind="status_grid"
      role="group"
      aria-label={envelope.component.title}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))`,
        gap: compact ? tokenRef('spacing_sm') : tokenRef('spacing_md'),
      }}
    >
      {items.map((item) => {
        // A tile's `key` IS its data key (the field's own description upstream),
        // and the board binds one projection read per tile so that one tile's
        // read can fail while the others succeed.
        const binding = bindings.find((candidate) => candidate.binding_id === item.key);
        if (binding === undefined) {
          throw new Error(
            `status tile '${item.key}' has no matching data binding in widget ` +
              `'${envelope.widget_id}'. A tile with no declared read cannot be ` +
              'shown to be current, and showing it anyway is how a stale verdict ' +
              'becomes a false green.',
          );
        }
        return (
          <StatusTile
            key={item.key}
            item={item}
            role={roleFor(config, item.verdict.severity)}
            resolution={resolveBinding(envelope.component, binding, datasets)}
            showLabel={showLabels}
            compact={compact}
          />
        );
      })}
    </div>
  );
}
