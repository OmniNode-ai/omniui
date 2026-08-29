// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * A JSON parser that keeps number literals (OMN-16935, Phase 1B.1).
 *
 * **Why this exists, because `JSON.parse` looks like it should be enough.**
 * A widget envelope's seal is a hash over Python's canonical JSON. Python's
 * data model distinguishes `int` from `float`; JSON's does not, and neither
 * does JavaScript. `ModelStatusSecondary.value` is a `float`, so a tile
 * carrying 1840 is serialised by Python as `1840.0` and hashed as `1840.0`.
 * `JSON.parse` reads that as the JavaScript number 1840, and every JavaScript
 * writer emits it as `1840`. The digests then differ by two characters, the
 * seal fails, and nothing about the envelope was wrong.
 *
 * The fix is to stop discarding the literal. This parser produces the same tree
 * `JSON.parse` would, except every number is carried as its **source text**.
 * Everything else about the canonical form is still recomputed — key order,
 * whitespace, indentation, and `null`-vs-absent are all normalised away, so
 * formatting churn still does not read as an edit, exactly as the upstream
 * docstring requires.
 *
 * What this does mean, stated rather than buried: the *written form* of a
 * number is load-bearing for a seal. `1840` and `1840.0` are the same JSON
 * value and different sealed bytes. That is a property of hashing a Python
 * object graph through JSON, not something this module introduces, and a
 * consumer that re-serialises before verifying has already destroyed the
 * evidence.
 */

/** A number, carried as the characters that spelled it. */
export interface RawNumber {
  readonly rawNumber: string;
}

/** A JSON tree whose numbers have not been narrowed to `number`. */
export type JsonSourceValue =
  | string
  | boolean
  | null
  | RawNumber
  | readonly JsonSourceValue[]
  | { readonly [key: string]: JsonSourceValue };

/**
 * Is this node a preserved number literal?
 *
 * @param value - The node to test.
 * @returns True when it carries raw number text.
 */
export function isRawNumber(value: unknown): value is RawNumber {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rawNumber' in value &&
    typeof (value as RawNumber).rawNumber === 'string'
  );
}

const WHITESPACE = new Set([' ', '\t', '\n', '\r']);
const NUMBER_START = /[-0-9]/;
const NUMBER_BODY = /[-+.eE0-9]/;

/** A cursor over the source text. Mutable by design; scoped to one parse. */
interface Cursor {
  readonly text: string;
  index: number;
}

/**
 * Fail with the offset, which is the only thing that makes a parse error useful.
 *
 * @param cursor - The cursor.
 * @param message - What went wrong.
 * @returns Never; always throws.
 * @throws {SyntaxError} Always.
 */
function fail(cursor: Cursor, message: string): never {
  throw new SyntaxError(`JSON source: ${message} at offset ${String(cursor.index)}`);
}

/**
 * Advance past insignificant whitespace.
 *
 * @param cursor - The cursor.
 */
function skipWhitespace(cursor: Cursor): void {
  while (cursor.index < cursor.text.length) {
    const char = cursor.text[cursor.index];
    if (char === undefined || !WHITESPACE.has(char)) {
      return;
    }
    cursor.index += 1;
  }
}

/**
 * Read the character under the cursor.
 *
 * @param cursor - The cursor.
 * @returns The character.
 * @throws {SyntaxError} At end of input.
 */
function peek(cursor: Cursor): string {
  const char = cursor.text[cursor.index];
  if (char === undefined) {
    fail(cursor, 'unexpected end of input');
  }
  return char;
}

/**
 * Consume an exact literal.
 *
 * @param cursor - The cursor.
 * @param literal - The text to consume.
 * @throws {SyntaxError} If the input does not start with it.
 */
function expect(cursor: Cursor, literal: string): void {
  if (!cursor.text.startsWith(literal, cursor.index)) {
    fail(cursor, `expected '${literal}'`);
  }
  cursor.index += literal.length;
}

/**
 * Parse a string, decoding its escapes.
 *
 * Delegates the escape handling to `JSON.parse` over the exact slice, so this
 * module owns no second, subtly different unescaping implementation.
 *
 * @param cursor - The cursor, positioned at the opening quote.
 * @returns The decoded string.
 * @throws {SyntaxError} On an unterminated or malformed string.
 */
function parseString(cursor: Cursor): string {
  const start = cursor.index;
  expect(cursor, '"');
  while (cursor.index < cursor.text.length) {
    const char = peek(cursor);
    if (char === '\\') {
      cursor.index += 2;
      continue;
    }
    cursor.index += 1;
    if (char === '"') {
      const slice = cursor.text.slice(start, cursor.index);
      const decoded: unknown = JSON.parse(slice);
      if (typeof decoded !== 'string') {
        fail(cursor, 'string slice did not decode to a string');
      }
      return decoded;
    }
  }
  fail(cursor, 'unterminated string');
}

/**
 * Parse one JSON value.
 *
 * @param cursor - The cursor.
 * @returns The parsed node, numbers kept as source text.
 * @throws {SyntaxError} On malformed input.
 */
function parseValue(cursor: Cursor): JsonSourceValue {
  skipWhitespace(cursor);
  const char = peek(cursor);

  if (char === '{') {
    cursor.index += 1;
    const out: Record<string, JsonSourceValue> = {};
    skipWhitespace(cursor);
    if (peek(cursor) === '}') {
      cursor.index += 1;
      return out;
    }
    for (;;) {
      skipWhitespace(cursor);
      const key = parseString(cursor);
      skipWhitespace(cursor);
      expect(cursor, ':');
      out[key] = parseValue(cursor);
      skipWhitespace(cursor);
      const next = peek(cursor);
      cursor.index += 1;
      if (next === '}') {
        return out;
      }
      if (next !== ',') {
        fail(cursor, "expected ',' or '}'");
      }
    }
  }

  if (char === '[') {
    cursor.index += 1;
    const out: JsonSourceValue[] = [];
    skipWhitespace(cursor);
    if (peek(cursor) === ']') {
      cursor.index += 1;
      return out;
    }
    for (;;) {
      out.push(parseValue(cursor));
      skipWhitespace(cursor);
      const next = peek(cursor);
      cursor.index += 1;
      if (next === ']') {
        return out;
      }
      if (next !== ',') {
        fail(cursor, "expected ',' or ']'");
      }
    }
  }

  if (char === '"') {
    return parseString(cursor);
  }
  if (char === 't') {
    expect(cursor, 'true');
    return true;
  }
  if (char === 'f') {
    expect(cursor, 'false');
    return false;
  }
  if (char === 'n') {
    expect(cursor, 'null');
    return null;
  }
  if (NUMBER_START.test(char)) {
    const start = cursor.index;
    cursor.index += 1;
    while (cursor.index < cursor.text.length) {
      const body = cursor.text[cursor.index];
      if (body === undefined || !NUMBER_BODY.test(body)) {
        break;
      }
      cursor.index += 1;
    }
    const rawNumber = cursor.text.slice(start, cursor.index);
    if (!Number.isFinite(Number(rawNumber))) {
      fail(cursor, `'${rawNumber}' is not a finite number`);
    }
    return { rawNumber };
  }

  return fail(cursor, `unexpected character '${char}'`);
}

/**
 * Parse JSON, keeping every number's source text.
 *
 * @param text - The JSON document.
 * @returns The parsed tree.
 * @throws {SyntaxError} On malformed input or trailing content.
 */
export function parseJsonSource(text: string): JsonSourceValue {
  const cursor: Cursor = { text, index: 0 };
  const value = parseValue(cursor);
  skipWhitespace(cursor);
  if (cursor.index !== text.length) {
    fail(cursor, 'trailing content after the top-level value');
  }
  return value;
}

/**
 * Narrow a source tree to ordinary JSON values.
 *
 * Used once a seal has been verified, to hand components the same tree
 * `JSON.parse` would have produced.
 *
 * @param value - The source tree.
 * @returns The tree with numbers narrowed to `number`.
 */
export function narrowJsonSource(value: JsonSourceValue): unknown {
  if (isRawNumber(value)) {
    return Number(value.rawNumber);
  }
  if (Array.isArray(value)) {
    return (value as readonly JsonSourceValue[]).map(narrowJsonSource);
  }
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, JsonSourceValue>)) {
      out[key] = narrowJsonSource(nested);
    }
    return out;
  }
  return value;
}
