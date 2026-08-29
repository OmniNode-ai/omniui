// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The declared empty state (OMN-16935, Phase 1B.1).
 *
 * `EnumEmptyStateReason`'s own docstring is explicit: *"A renderer MUST NOT
 * collapse SCHEMA_INVALID into NO_DATA — each reason maps to a distinct
 * operator diagnostic."* This component is where that stops being a comment.
 * Each of the four reasons gets its own sentence and its own glyph, and the
 * reason is stamped on the DOM as `data-onex-empty-reason` so a test asserts on
 * the reason rather than on prose.
 *
 * The thing this component exists to prevent is the blank. A widget that
 * renders nothing when its read failed is indistinguishable from a widget
 * whose read succeeded and found nothing wrong — which, on a health board, is
 * the difference between "everything is fine" and "we have no idea".
 */

import type { ReactNode } from 'react';

import type { EnumEmptyStateReason } from '../generated/onex-models.js';
import { tokenRef } from '../theme/css-variables.js';

import { Icon } from './Icon.js';

/** What each declared reason says, and which glyph carries it. */
const REASON_PRESENTATION: Readonly<
  Record<EnumEmptyStateReason, { readonly label: string; readonly icon: string }>
> = {
  'no-data': { label: 'No data', icon: 'slash-circle' },
  'missing-field': { label: 'Missing field', icon: 'column-missing' },
  'upstream-blocked': { label: 'Upstream unavailable', icon: 'plug-off' },
  'schema-invalid': { label: 'Schema mismatch', icon: 'file-invalid' },
};

export interface EmptyStateProps {
  /** The declared reason. Never inferred, never defaulted. */
  readonly reason: EnumEmptyStateReason;
  /** Operator-facing specifics: which binding, which field, which topic. */
  readonly detail: string;
  /** Render at tile scale rather than at widget scale. */
  readonly compact?: boolean;
}

/**
 * Render why there is nothing to render.
 *
 * @param props - The declared reason and its specifics.
 * @returns The empty state, carrying its reason on the DOM.
 */
export function EmptyState({ reason, detail, compact = false }: EmptyStateProps): ReactNode {
  const { label, icon } = REASON_PRESENTATION[reason];
  return (
    <div
      role="status"
      data-onex-empty-reason={reason}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: tokenRef('spacing_xs'),
        padding: compact ? tokenRef('spacing_sm') : tokenRef('spacing_md'),
        borderRadius: tokenRef('border_radius_md'),
        border: `1px dashed ${tokenRef('color_border_default')}`,
        backgroundColor: tokenRef('color_background_secondary'),
        color: tokenRef('color_text_secondary'),
        fontFamily: tokenRef('font_family_base'),
        fontSize: compact ? tokenRef('font_size_sm') : tokenRef('font_size_md'),
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: tokenRef('spacing_xs'),
          fontWeight: tokenRef('font_weight_bold'),
        }}
      >
        <Icon name={icon} title={label} />
        <span data-onex-empty-label>{label}</span>
      </span>
      <span data-onex-empty-detail style={{ fontSize: tokenRef('font_size_sm') }}>
        {detail}
      </span>
    </div>
  );
}
