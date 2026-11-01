// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * `schema/onex-models.json` -> `src/generated/onex-models.ts` (OMN-16889).
 *
 * The JSON Schema half is produced upstream by `omnibase_core`'s
 * `scripts/emit_ts_types.py`; `schema/onex-models.provenance.json` records the
 * commit and the digest, and this script writes that file too. This script is
 * only the TypeScript half plus that record, and it is deliberately the whole
 * of it: no hand-edits, no post-processing pass, no "just this one type"
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
const PROVENANCE_PATH = join(REPO_ROOT, 'schema', 'onex-models.provenance.json');

const COMMIT_PATTERN = /^[0-9a-f]{40}$/;

interface Provenance {
  _generated: string;
  source_repo: string;
  source_commit: string;
  emitter: string;
  schema_sha256: string;
  defs_count: number;
}

/**
 * The provenance record. The digest and the definitions count are computed from
 * the schema on disk. The source repository, commit and emitter are facts about
 * the upstream run that no file in this repo can derive, so they are carried
 * forward from the previous record, and the commit is replaced only when
 * `ONEX_MODELS_SOURCE_COMMIT` names the upstream commit that was mirrored.
 */
function buildProvenance(raw: string, schema: { $defs?: Record<string, unknown> }): Provenance {
  const previous = JSON.parse(readFileSync(PROVENANCE_PATH, 'utf8')) as Provenance;
  const sourceCommit = process.env.ONEX_MODELS_SOURCE_COMMIT ?? previous.source_commit;
  if (!COMMIT_PATTERN.test(sourceCommit)) {
    throw new Error(`ONEX_MODELS_SOURCE_COMMIT must be a 40-character lowercase commit sha, got ${sourceCommit}`);
  }
  return {
    _generated: previous._generated,
    source_repo: previous.source_repo,
    source_commit: sourceCommit,
    emitter: previous.emitter,
    schema_sha256: createHash('sha256').update(raw, 'utf8').digest('hex'),
    defs_count: Object.keys(schema.$defs ?? {}).length,
  };
}

const HEADER = `// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT
//
// GENERATED FILE — DO NOT EDIT.
//
// Source: schema/onex-models.json, itself emitted by omnibase_core's
// scripts/emit_ts_types.py. See schema/onex-models.provenance.json for the
// source commit and digest, and run \`npm run generate:onex-models\` to regenerate.
`;

async function main(): Promise<void> {
  const raw = readFileSync(SCHEMA_PATH, 'utf8');
  const schema = JSON.parse(raw) as JSONSchema & { $defs?: Record<string, unknown> };

  const body = await compile(schema, 'OnexModels', {
    additionalProperties: false,
    bannerComment: '',
    declareExternallyReferenced: true,
    enableConstEnums: false,
    format: false,
    unreachableDefinitions: true,
  });

  writeFileSync(OUTPUT_PATH, `${HEADER}\n${body}`, 'utf8');

  const provenance = buildProvenance(raw, schema);
  writeFileSync(PROVENANCE_PATH, `${JSON.stringify(provenance, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `wrote ${OUTPUT_PATH}\nwrote ${PROVENANCE_PATH}\n  source sha256: ${provenance.schema_sha256}\n`,
  );
}

await main();
