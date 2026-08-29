// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Accepting a widget envelope (OMN-16935, Phase 1B.1).
 *
 * `ModelWidgetEnvelope` (OMN-16883, Phase C2) is the unit Plane 1 distributes:
 * identity, component contract, discriminated config, provenance, and a seal
 * over all of it. This module is the consumer half — the code that decides
 * whether a received envelope is the bytes its publisher sealed, *before* any
 * component renders a pixel of it.
 *
 * **The API takes text, not a parsed object, and that is deliberate.** A seal
 * is over the publisher's canonical JSON; a consumer that parses and
 * re-serialises before verifying has already discarded evidence it needed
 * (see `json-source.ts` on `1840` versus `1840.0`). Taking the received
 * document keeps verification honest.
 *
 * The seal is checked, never recomputed-and-accepted. Re-sealing content that
 * failed its seal is how a supply chain launders an edit, and it is exactly
 * what `verify_widget_envelope` refuses upstream.
 */

import type { EnumWidgetType, ModelWidgetEnvelope } from '../generated/onex-models.js';

import { canonicalJson } from './canonical-json.js';
import { narrowJsonSource, parseJsonSource, type JsonSourceValue } from './json-source.js';
import { sha256Hex } from './sha256.js';

/** Seals are `sha256:<64 lowercase hex chars>`, matching the upstream pattern. */
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/** The field a seal cannot cover: itself. */
const UNSEALED_FIELD = 'content_digest';

/**
 * Return the seal an envelope's content implies.
 *
 * Mirrors `compute_widget_envelope_digest`: the canonical JSON of the envelope
 * with `content_digest` excluded, hashed with SHA-256.
 *
 * @param envelope - The envelope as a source tree, from `parseJsonSource`.
 * @returns The digest as `sha256:<64 lowercase hex chars>`.
 */
export function computeEnvelopeDigest(
  envelope: Readonly<Record<string, JsonSourceValue>>,
): string {
  const unsealed: Record<string, JsonSourceValue> = {};
  for (const [key, value] of Object.entries(envelope)) {
    if (key === UNSEALED_FIELD) {
      continue;
    }
    unsealed[key] = value;
  }
  return `sha256:${sha256Hex(canonicalJson(unsealed))}`;
}

/**
 * Accept an envelope source document, or refuse it with a reason.
 *
 * Three things are checked, in the order a consumer can check them:
 *
 * 1. It is an object carrying a well-formed `content_digest`.
 * 2. Its content digests to that value — the seal holds.
 * 3. Its `component.component_kind` agrees with its `config.config_kind`. The
 *    core model enforces this on construction; an envelope that arrived over a
 *    wire never went through that constructor, so the consumer enforces it too.
 *    An envelope where the two disagree renders as one thing and validates as
 *    another, which is precisely the out-of-band half-widget C2 ended.
 *
 * @param source - The envelope document, exactly as received.
 * @returns The envelope, typed.
 * @throws {TypeError} If it is not a sealed envelope shape.
 * @throws {Error} If the seal does not hold, or kind and config disagree.
 */
export function acceptEnvelope(source: string): ModelWidgetEnvelope {
  return acceptEnvelopeNode(parseJsonSource(source));
}

/**
 * Accept an envelope that is already a source tree.
 *
 * The same acceptance, for a caller that parsed a larger document and is
 * handing over one subtree — a capture file wrapping an envelope beside its
 * provenance note, or a discovery response carrying several. The number
 * literals must still be intact, which is what makes a subtree acceptable
 * evidence and a `JSON.parse` result not.
 *
 * @param parsed - The envelope subtree, from `parseJsonSource`.
 * @returns The envelope, typed.
 * @throws {TypeError} If it is not a sealed envelope shape.
 * @throws {Error} If the seal does not hold, or kind and config disagree.
 */
export function acceptEnvelopeNode(parsed: JsonSourceValue): ModelWidgetEnvelope {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('widget envelope: expected a JSON object');
  }
  const record = parsed as Record<string, JsonSourceValue>;

  const declared = record[UNSEALED_FIELD];
  if (typeof declared !== 'string' || !DIGEST_PATTERN.test(declared)) {
    throw new TypeError(
      `widget envelope: content_digest must be 'sha256:<64 lowercase hex>', got ` +
        JSON.stringify(declared),
    );
  }

  const recomputed = computeEnvelopeDigest(record);
  if (recomputed !== declared) {
    const raw = record.widget_id;
    const id = typeof raw === 'string' ? raw : '<unidentified>';
    throw new Error(
      `widget '${id}' fails its seal: declared content_digest ${declared} but its ` +
        `content digests to ${recomputed}; the envelope was edited after sealing. ` +
        'This is an error, never a recomputation — re-sealing edited bytes is how a ' +
        'supply chain launders an edit.',
    );
  }

  const envelope = narrowJsonSource(parsed) as ModelWidgetEnvelope;
  const kind: EnumWidgetType = envelope.component.component_kind;
  const configKind = (envelope.config as { config_kind?: string }).config_kind;
  if (configKind !== kind) {
    throw new Error(
      `widget '${envelope.widget_id}': component_kind '${kind}' does not match ` +
        `config_kind '${String(configKind)}'`,
    );
  }

  return envelope;
}
