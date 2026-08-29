// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `schema/onex-models.json` -> `src/generated/onex-models.ts` (OMN-16889).
 *
 * The JSON Schema half is produced upstream by `omnibase_core`'s
 * `scripts/emit_ts_types.py`; see `schema/PROVENANCE.md` for the commit and the
 * digest. This script is only the TypeScript half, and it is deliberately the
 * whole of it: no hand-edits, no post-processing pass, no "just this one type"
 * addition. `generated-artifact-parity` (plan §2.3) treats the output as an
 * artifact that must equal a fresh compile of its declared source.
 *
 * Determinism matters here for the same reason it matters in the token
 * compiler (G1A.2): the output is checked in, so any run-to-run variation
 * becomes unconditional working-tree churn — the R-22 defect omnidash already
 * has and this repo must not inherit. `json-schema-to-typescript` is given
 * `format: false` so no Prettier version can move the bytes underneath us.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile, type JSONSchema } from 'json-schema-to-typescript';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_PATH = join(REPO_ROOT, 'schema', 'onex-models.json');
const OUTPUT_PATH = join(REPO_ROOT, 'src', 'generated', 'onex-models.ts');

const HEADER = `// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT
//
// GENERATED FILE — DO NOT EDIT.
//
// Source: schema/onex-models.json, itself emitted by omnibase_core's
// scripts/emit_ts_types.py. See schema/PROVENANCE.md for the source commit and
// digest, and run \`npm run generate:onex-models\` to regenerate.
`;

async function main(): Promise<void> {
  const raw = readFileSync(SCHEMA_PATH, 'utf8');
  const schema = JSON.parse(raw) as JSONSchema;

  const body = await compile(schema, 'OnexModels', {
    additionalProperties: false,
    bannerComment: '',
    declareExternallyReferenced: true,
    enableConstEnums: false,
    format: false,
    unreachableDefinitions: true,
  });

  writeFileSync(OUTPUT_PATH, `${HEADER}\n${body}`, 'utf8');

  const digest = createHash('sha256').update(raw, 'utf8').digest('hex');
  process.stdout.write(`wrote ${OUTPUT_PATH}\n  source sha256: ${digest}\n`);
}

await main();
