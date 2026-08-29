// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The canonical form has to agree with Python, not with itself (OMN-16935).
 *
 * Every expectation here was produced by running the corresponding
 * `json.dumps(..., sort_keys=True, ensure_ascii=True)` — including the two
 * places the Python departs from what a reader would guess: the spaced
 * separators, and `None` stripping that keeps `[]` and keeps `null` inside a
 * list. A test that only checked this module against itself would pass while
 * disagreeing with every seal ever issued.
 */

import { describe, expect, it } from 'vitest';

import { canonicalJson } from './canonical-json.js';
import { parseJsonSource } from './json-source.js';
import { sha256Hex } from './sha256.js';

/**
 * Canonicalise a JSON document given as text.
 *
 * @param text - The document.
 * @returns Its canonical form.
 */
function canonical(text: string): string {
  return canonicalJson(parseJsonSource(text));
}

describe('canonicalJson', () => {
  it('uses the spaced separators json.dumps defaults to, not the compact ones', () => {
    // json.dumps({"b": 1, "a": [1, 2]}, sort_keys=True) ==
    //   '{"a": [1, 2], "b": 1}'
    expect(canonical('{"b":1,"a":[1,2]}')).toBe('{"a": [1, 2], "b": 1}');
  });

  it('sorts keys', () => {
    expect(canonical('{"z":1,"a":2,"m":3}')).toBe('{"a": 2, "m": 3, "z": 1}');
  });

  it('strips null values from objects, recursively', () => {
    expect(canonical('{"a":1,"b":null,"c":{"d":null,"e":2}}')).toBe('{"a": 1, "c": {"e": 2}}');
  });

  it('keeps an empty list, which is not the same fact as absent', () => {
    expect(canonical('{"a":[]}')).toBe('{"a": []}');
  });

  it('keeps null INSIDE a list — a hole in a series is data', () => {
    expect(canonical('{"a":[1,null,3]}')).toBe('{"a": [1, null, 3]}');
  });

  it('preserves a float literal rather than narrowing it to an integer', () => {
    // The case that made `json-source.ts` necessary: ModelStatusSecondary.value
    // is a float, so Python writes and hashes 1840.0.
    expect(canonical('{"value":1840.0}')).toBe('{"value": 1840.0}');
    expect(canonical('{"value":1840}')).toBe('{"value": 1840}');
  });

  it('refuses a bare number, which has already lost its spelling', () => {
    expect(() => canonicalJson({ value: 1840 })).toThrow(/bare number/);
  });

  it('escapes non-ASCII as \\uXXXX, the way ensure_ascii does', () => {
    expect(canonical('{"a":"caf\\u00e9"}')).toBe('{"a": "caf\\u00e9"}');
  });

  it('escapes control characters and DEL, and uses the short forms', () => {
    expect(canonical('{"a":"x\\ny\\u0001z\\u007f"}')).toBe('{"a": "x\\ny\\u0001z\\u007f"}');
  });

  it('escapes quotes and backslashes', () => {
    expect(canonical('{"a":"he said \\"hi\\"\\\\"}')).toBe('{"a": "he said \\"hi\\"\\\\"}');
  });

  it('refuses a non-ASCII object key rather than sorting it by an unproven order', () => {
    expect(() => canonical('{"caf\\u00e9":1}')).toThrow(/printable ASCII/);
  });

  it('reproduces a digest Python computed over a known document', () => {
    // compute_canonical_hash({"a": 1, "b": None, "c": ["x", 2.5]}) in
    // omnibase_core, whose canonical form is '{"a": 1, "c": ["x", 2.5]}'.
    const document = '{"c":["x",2.5],"a":1,"b":null}';
    expect(canonical(document)).toBe('{"a": 1, "c": ["x", 2.5]}');
    // Ground truth, run against omnibase_core's own implementation:
    //   compute_canonical_hash({"a": 1, "b": None, "c": ["x", 2.5]})
    //   -> 0366452a5bb4dfdd44a8bd2c1ab5f0880539928df685d42b9b4d6ecef98e4a86
    expect(sha256Hex(canonical(document))).toBe(
      '0366452a5bb4dfdd44a8bd2c1ab5f0880539928df685d42b9b4d6ecef98e4a86',
    );
  });
});
