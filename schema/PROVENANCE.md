# `schema/onex-models.json` — where this came from and how to refresh it

`onex-models.json` is the combined JSON Schema of the ONEX contract models omniui renders against. It is **generated**, never hand-edited (plan §2.3, `generated-artifact-parity`).

## Source of record

| | |
|---|---|
| Repo | `OmniNode-ai/omnibase_core` |
| Commit | `872beef0397e81064e1212ad5d9d73f173ea3f84` (`dev`) |
| Emitter | `scripts/emit_ts_types.py` |
| Emitter model registry | `MODELS` dict, `scripts/emit_ts_types.py` |
| SHA-256 of this file | `155d4ed8ba3cd71e75da79b7c39132dd6bcefdfd2fe947276ce4d22adde13c51` |
| `$defs` count | 58 |

## Refresh procedure

```bash
# in an omnibase_core checkout at the commit you intend to mirror
uv run python scripts/emit_ts_types.py /path/to/omniui/schema/onex-models.json

# in omniui
npm run generate:onex-models   # schema/onex-models.json -> src/generated/onex-models.ts
npm run lint && npm run typecheck && npm test
```

Then update the **Commit** and **SHA-256** rows above. `src/generated/mirror-freshness.test.ts` asserts that the digest recorded here matches the file actually checked in, so a schema refreshed without updating this table fails the build rather than drifting silently.

## G1A.5 — mirror freshness

> **Passes when:** regenerating from `emit_ts_types.py` produces a mirror containing the theme schema and the C2 envelope.
> **Falsified by:** either symbol still missing after regeneration.

Both halves are present at the commit above, verified by regenerating twice into separate files:

```
sha256(run 1) = 155d4ed8ba3cd71e75da79b7c39132dd6bcefdfd2fe947276ce4d22adde13c51
sha256(run 2) = 155d4ed8ba3cd71e75da79b7c39132dd6bcefdfd2fe947276ce4d22adde13c51   # byte-identical
$defs = 58
ModelRendererThemeContract  PRESENT      ModelWidgetEnvelope    PRESENT
ModelThemeInstance          PRESENT      ModelWidgetProvenance  PRESENT
ModelThemeCatalog           PRESENT      ModelComponentContract PRESENT
ModelThemeCatalogEntry      PRESENT      ModelStatusItemConfig  PRESENT
ModelThemeActivation        PRESENT      ModelWidgetConfigStatusGrid PRESENT
```

### Correction to the plan and to OMN-16889

The plan (§1.4) and this ticket both carry a `[verified]` note that today's mirror carries **neither** the theme schema nor the envelope. That was true when it was written and is **stale now**: Phase C landed `f3cb4d72` (theme instances + catalog), `32cf8fcd` (widget envelope), and `c8050400` (severity family) on `omnibase_core` `dev`, and each registered its models in the emitter's `MODELS` dict. The gate's *mirror* half was already passing before this repo consumed it. What was genuinely missing — and is what this ticket supplies — is a **consumer**: a checked-in mirror in omniui, a regeneration path, and a test that fails when the two disagree. A gate satisfied upstream by a script nobody runs downstream is the reachability failure this plan exists to close, in miniature.
