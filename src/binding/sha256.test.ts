// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * SHA-256 against the published vectors (OMN-16935).
 *
 * A hand-rolled hash gets exactly one kind of test: the standard vectors, plus
 * a case long enough to force a second block, plus a case that lands exactly on
 * a padding boundary. Everything else in this repo trusts these bytes.
 */

import { describe, expect, it } from 'vitest';

import { sha256Hex } from './sha256.js';

describe('sha256Hex', () => {
  it('matches the empty-string vector', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('matches the FIPS 180-2 "abc" vector', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the 448-bit two-block vector', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('matches the million-a vector, which exercises many blocks', () => {
    expect(sha256Hex('a'.repeat(1_000_000))).toBe(
      'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    );
  });

  it('handles a message exactly on the padding boundary (55 and 56 bytes)', () => {
    expect(sha256Hex('a'.repeat(55))).toBe(
      '9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318',
    );
    expect(sha256Hex('a'.repeat(56))).toBe(
      'b35439a4ac6f0948b6d6f9e3c6af0f5f590ce20f1bde7090ef7970686ec6738a',
    );
  });

  it('hashes UTF-8 bytes, not UTF-16 code units', () => {
    // hashlib.sha256("café".encode()).hexdigest() — five bytes, not four
    // characters. A digest over code units would differ and would be wrong
    // everywhere a contract carries a non-ASCII string.
    expect(new TextEncoder().encode('café')).toHaveLength(5);
    expect(sha256Hex('café')).toBe(
      '850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e',
    );
  });
});
