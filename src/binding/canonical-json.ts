// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * The canonical JSON `omnibase_core` hashes, reproduced in TypeScript
 * (OMN-16935).
 *
 * A widget envelope's `content_digest` is computed upstream by
 * `omnibase_core.utils.util_canonical_hash.compute_canonical_hash`. For a
 * consumer to *verify* a seal rather than take a publisher's word for it, it
 * has to produce the same bytes that hash was taken over. That is this module,
 * and it is written against the Python implementation's actual behaviour rather
 * than against RFC 8785, which the Python differs from in one visible way.
 *
 * The rules, each traceable to a line of `util_canonical_hash.py`:
 *
 * 1. **`null` values are stripped from objects, recursively.** Absent and
 *    `None` are the same fact upstream (`_strip_none_values`), so a serialiser
 *    that emits `"cursor_field": null` and one that omits it must agree.
 * 2. **`null` inside an array is kept.** The Python maps over lists without
 *    filtering, and a hole in a series is data.
 * 3. **Keys are sorted** (`sort_keys=True`).
 * 4. **Non-ASCII is escaped** (`ensure_ascii=True`), as `\uXXXX`, with
 *    surrogate pairs written as two escapes — Python's own behaviour.
 * 5. **Separators are `", "` and `": "`.** This is where the Python departs
 *    from RFC 8785 despite the docstring's claim: `json.dumps` without a
 *    `separators=` argument and without `indent` uses the spaced defaults.
 *    `JSON.stringify` uses the compact ones. Reproducing the *implementation*
 *    rather than the *docstring* is the whole point — a verifier that follows
 *    the docstring disagrees with every seal ever issued.
 *
 * Two inputs fail closed rather than guess:
 *
 * - **A bare JavaScript number.** Python distinguishes `1840` from `1840.0` and
 *   JSON does not, so a number that reached here through `JSON.parse` has
 *   already lost the only evidence of which one it was. Numbers must arrive as
 *   `RawNumber` literals from `parseJsonSource`; a bare `number` throws rather
 *   than guessing a spelling and producing a seal mismatch nobody can see. See
 *   `json-source.ts` for the whole argument.
 * - **Non-ASCII object keys.** Python sorts strings by code point; JavaScript's
 *   default comparison is by UTF-16 code unit, and the two disagree above the
 *   BMP. No contract in this repo has such a key, so the case throws rather
 *   than carrying an unproven ordering.
 */

import { isRawNumber } from './json-source.js';

const SHORT_ESCAPES: ReadonlyMap<number, string> = new Map([
  [0x08, '\\b'],
  [0x09, '\\t'],
  [0x0a, '\\n'],
  [0x0c, '\\f'],
  [0x0d, '\\r'],
  [0x22, '\\"'],
  [0x5c, '\\\\'],
]);

/**
 * Encode a string the way Python's `json.dumps(..., ensure_ascii=True)` does.
 *
 * @param value - The string to encode.
 * @returns The encoded string, including its surrounding quotes.
 */
function encodeString(value: string): string {
  let out = '"';
  for (const unit of value) {
    // Iterating a string yields whole code points, so a surrogate pair arrives
    // as one two-unit string; both halves are emitted, matching Python.
    for (let i = 0; i < unit.length; i += 1) {
      const code = unit.charCodeAt(i);
      const short = SHORT_ESCAPES.get(code);
      if (short !== undefined) {
        out += short;
        continue;
      }
      // Python's ESCAPE_ASCII pattern escapes everything outside the printable
      // ASCII range 0x20-0x7e, DEL included.
      if (code < 0x20 || code > 0x7e) {
        out += `\\u${code.toString(16).padStart(4, '0')}`;
        continue;
      }
      out += unit.charAt(i);
    }
  }
  return `${out}"`;
}

/**
 * Is this value one the Python strips from an object?
 *
 * @param value - The value to test.
 * @returns True for `null` and `undefined`.
 */
function isStripped(value: unknown): boolean {
  return value === null || value === undefined;
}

/**
 * Serialise a value to the canonical JSON `compute_canonical_hash` hashes.
 *
 * @param value - A tree from `parseJsonSource`, whose numbers are literals.
 * @returns The canonical JSON text.
 * @throws {TypeError} On a bare `number`, a non-ASCII object key, or a value
 *   JSON cannot represent.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    throw new TypeError(
      `canonical JSON: the bare number ${String(value)} cannot be sealed. Python ` +
        'writes 1840 and 1840.0 differently and JSON records neither, so a number ' +
        'that arrived through JSON.parse has already lost the evidence of which it ' +
        'was. Parse with parseJsonSource(), which keeps the literal.',
    );
  }
  if (isRawNumber(value)) {
    return value.rawNumber;
  }
  if (typeof value === 'string') {
    return encodeString(value);
  }
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const element of value as readonly unknown[]) {
      // A `None` inside a list survives upstream, so it survives here.
      parts.push(element === undefined ? 'null' : canonicalJson(element));
    }
    return `[${parts.join(', ')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => !isStripped(record[key]))
      .sort();
    const parts: string[] = [];
    for (const key of keys) {
      // The guard is exactly "printable ASCII", which is why the range starts
      // at the space character rather than at a word boundary.
      if (!/^[ -~]*$/.test(key)) {
        throw new TypeError(
          `canonical JSON: object key '${key}' is not printable ASCII. Python sorts ` +
            'by code point and JavaScript by code unit; the two disagree above the ' +
            'BMP, so an unproven ordering fails closed instead of sealing.',
        );
      }
      parts.push(`${encodeString(key)}: ${canonicalJson(record[key])}`);
    }
    return `{${parts.join(', ')}}`;
  }
  throw new TypeError(`canonical JSON: values of type ${typeof value} are not serialisable`);
}
