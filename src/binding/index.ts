// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The widget-envelope binding seam (OMN-16935, Phase 1B.1).
 *
 * Everything a host needs to hand a component its data, and everything a
 * component needs to render from an envelope without ever performing a read.
 */

export { acceptEnvelope, acceptEnvelopeNode, computeEnvelopeDigest } from './envelope.js';
export { canonicalJson } from './canonical-json.js';
export {
  isRawNumber,
  narrowJsonSource,
  parseJsonSource,
  type JsonSourceValue,
  type RawNumber,
} from './json-source.js';
export { sha256Hex, sha256HexBytes } from './sha256.js';
export {
  orderRows,
  requireBinding,
  resolveBinding,
  type BindingResolution,
  type BoundDataset,
  type HostDatasets,
  type ProjectionRow,
  type ResolvedBinding,
  type UnresolvedBinding,
} from './resolve.js';
