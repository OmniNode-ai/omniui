// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * SHA-256, in TypeScript, synchronous and dependency-free (OMN-16935).
 *
 * Three options were available and two were rejected for stated reasons.
 * `node:crypto` is synchronous but is not a browser module, and this library is
 * executed in a browser by every surface that consumes it. `crypto.subtle` is
 * isomorphic but asynchronous, which would make seal verification an `await`
 * inside a render path — a component that cannot say whether its envelope is
 * authentic until a microtask later has to render *something* in the meantime,
 * and that something is the unverified content.
 *
 * So the digest is computed here, synchronously, by the book (FIPS 180-4). It
 * is covered by the published test vectors, and cross-checked against a digest
 * `omnibase_core` computed in Python — which is the agreement that matters.
 */

/** The first 32 bits of the fractional parts of the cube roots of the first 64 primes. */
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** The first 32 bits of the fractional parts of the square roots of the first 8 primes. */
const H0 = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

/**
 * Read a word, refusing to invent one.
 *
 * `noUncheckedIndexedAccess` types every typed-array read as possibly
 * undefined, and the honest response is to fail rather than to coalesce to
 * zero. A zero substituted for an out-of-range read produces a digest that is
 * wrong and looks fine, which is the one failure mode a seal cannot tolerate.
 *
 * @param array - The word array.
 * @param index - The index to read.
 * @returns The word at that index.
 * @throws {RangeError} If the index is out of range.
 */
function word(array: Uint32Array, index: number): number {
  const value = array[index];
  if (value === undefined) {
    throw new RangeError(`sha256: word index ${String(index)} is out of range`);
  }
  return value;
}

/**
 * Rotate a 32-bit word right.
 *
 * @param value - The word.
 * @param bits - How far to rotate, 0-31.
 * @returns The rotated word, as an unsigned 32-bit value.
 */
function rotr(value: number, bits: number): number {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0;
}

/**
 * Return the SHA-256 digest of a byte sequence, as lowercase hex.
 *
 * @param bytes - The message.
 * @returns 64 lowercase hexadecimal characters.
 */
export function sha256HexBytes(bytes: Uint8Array): string {
  // One 0x80 byte, then zeroes, then a 64-bit big-endian bit length, padded up
  // to a 64-byte block boundary.
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const h = new Uint32Array(H0);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const x = word(w, i - 15);
      const y = word(w, i - 2);
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
      w[i] = (word(w, i - 16) + s0 + word(w, i - 7) + s1) >>> 0;
    }

    let a = word(h, 0);
    let b = word(h, 1);
    let c = word(h, 2);
    let d = word(h, 3);
    let e = word(h, 4);
    let f = word(h, 5);
    let g = word(h, 6);
    let hh = word(h, 7);

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + word(K, i) + word(w, i)) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (word(h, 0) + a) >>> 0;
    h[1] = (word(h, 1) + b) >>> 0;
    h[2] = (word(h, 2) + c) >>> 0;
    h[3] = (word(h, 3) + d) >>> 0;
    h[4] = (word(h, 4) + e) >>> 0;
    h[5] = (word(h, 5) + f) >>> 0;
    h[6] = (word(h, 6) + g) >>> 0;
    h[7] = (word(h, 7) + hh) >>> 0;
  }

  let out = '';
  for (const value of h) {
    out += value.toString(16).padStart(8, '0');
  }
  return out;
}

/**
 * Return the SHA-256 digest of a string's UTF-8 bytes, as lowercase hex.
 *
 * @param text - The string to digest.
 * @returns 64 lowercase hexadecimal characters.
 */
export function sha256Hex(text: string): string {
  return sha256HexBytes(new TextEncoder().encode(text));
}
