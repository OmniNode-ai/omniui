# Plane-2 distribution — how omniui reaches a consumer, and what still blocks it

**Ticket:** OMN-16887 (Phase 1A.3). **Gate:** G1A.1. **Ruling:** D2b, 2026-08-28 — public npm, `--provenance`, exact pins, downstream pin-bump mirrored from `omnibase_core`.

## Why this is the load-bearing ticket of Phase 1A

The plan's Option B (a new repo) **holds only if Plane-2 distribution is real**. An unreachable new repo is strictly worse than an in-place rework, because it has the same problems plus a second place to look. All three prior lineages died as distribution failures, and Stall 1 died specifically on *never publishing and never being installed anywhere*: `@omninode/tokens` v1.0.0 has no `publishConfig`, is consumed only as `workspace:*`, and `grep omninode omnidash/package.json` returns zero hits.

G1A.1 exists so that failure cannot repeat silently.

> **G1A.1 passes when** a scratch consumer **outside the library's workspace** installs the pinned artifact by exact version, verifies its digest and provenance, renders a component, and can roll back to a prior version by moving the pin.
> **G1A.1 is falsified by** any path that only works via a workspace/relative link; any consumer that cannot verify provenance; any version that can be re-published in place.

## What is built and in the repo

| Piece | Where | What it does |
|---|---|---|
| Publish pipeline | `.github/workflows/publish.yml` | Release-triggered. Asserts the release tag matches `package.json`'s version, asserts `publishConfig.access=public`, publishes with `--provenance` via OIDC, then **reads the artifact back from the registry** and writes integrity + shasum + tarball to the job summary. |
| Dry run | same, `workflow_dispatch` | Packs and attests without publishing, so the pipeline can be exercised without cutting a release. |
| Reachability proof | `scripts/verify-reachability.sh` | **This is the gate.** Six steps, run from a `mktemp -d` outside the repo. |
| Downstream pin bump | `.github/workflows/downstream-pin-bump.yml` + `scripts/pin-bump-npm.mjs` | Opens an exact-version pin-bump PR in every registered consumer after a release, regenerates the lockfile, and **fails if the lockfile did not move**. |
| Consumer registry | `docs/downstream-consumers.json` | The manifest the bump reads. Consumers are registered, never discovered. |

### The six steps of `verify-reachability.sh`

1. Install `<pkg>@<version>` with `--save-exact`, and assert the dependency spec is the exact version.
2. Assert the lockfile resolved from `https://registry.npmjs.org/` — **not** a `file:`/`link:` resolution. This is the step that makes "outside the workspace" mean something.
3. Compare the lockfile's integrity hash against what the registry reports for that exact version.
4. `npm audit signatures` — provenance is only worth having if a consumer checks it.
5. **Render a component from the installed package**, importing by the bare package specifier and never a relative path. Asserts the rendered markup carries `data-onex-theme`, a `--onex-*` custom property, and the theme's content digest.
6. Roll back to the prior version and prove the **old bytes** came back by digest — and that the two versions have *different* digests, so "rollback" is not two names for one artifact.

Step 6 runs last on purpose: a rollback followed by a reinstall of the new version proves nothing.

## What blocks G1A.1, and why no agent can clear it

**Both are operator actions.**

1. **The `@omninode` npm scope does not exist.** `GET https://registry.npmjs.org/-/org/omninode/package` returns `{"error":"Scope not found"}`, and both `@omninode/omniui` and `@omninode/tokens` return `404`. Creating an npm organization requires an npm account; an agent has none and cannot create one.
2. **No publish credential is provisioned.** `omniui` has **zero** repository secrets, and the org secrets visible to it (`BRANCH_PROTECTION_PAT`, `CROSS_REPO_PAT`, `ONEXBOT_APP_ID`, `ONEXBOT_APP_PRIVATE_KEY`, `ONEXBOT_OCC_APP_ID`, `ONEXBOT_OCC_PRIVATE_KEY`, `POLICY_GATE_TOKEN`, `PYPI_TOKEN`) contain no npm token. `publish.yml` reads `secrets.NPM_PUBLISH_TOKEN`, which is unset.

   npm **trusted publishing** would remove the token entirely — the OIDC path this workflow already uses — but configuring a trusted publisher is done on npmjs.com against the package, which again needs the account and the scope.

Until then `package.json` keeps `"private": true` and `npm publish` refuses. **That refusal is the gate, not a bug.** It is also the honest state: publishing cannot be faked, and a Phase 1A that claimed G1A.1 green on a dry run would be reproducing Stall 3 — a criterion satisfied by something that was not the thing.

### The unblock, in order

1. Operator creates the `@omninode` npm org (or confirms an existing one) and grants publish rights.
2. Operator either sets the `NPM_PUBLISH_TOKEN` repository secret, **or** configures npm trusted publishing for `@omninode/omniui` against `OmniNode-ai/omniui` + `publish.yml` — the second is preferable, because it removes a long-lived credential.
3. Flip `"private": false` in `package.json`, set the version to `0.0.1-alpha.0`, tag and release. **A throwaway version, before any real component exists** — that sequencing is the plan's, and it is what stops the pipeline from being proven only after it can no longer fail cheaply.
4. Publish `0.0.1-alpha.1`.
5. Run `scripts/verify-reachability.sh @omninode/omniui 0.0.1-alpha.1 0.0.1-alpha.0` from a directory outside this repo. **That transcript is G1A.1's evidence.**
6. Only then register a real consumer in `docs/downstream-consumers.json` and let the bump workflow run.

## Things not to change without re-reading the reasoning

- **Runners stay `ubuntu-latest`.** omniui is public; public repos use GitHub-hosted runners. Do not port `omnibase_core`'s `OMNI_TRUSTED_CI_RUNS_ON_JSON` selector across.
- **`id-token: write` is required for provenance.** Removing it does not degrade the publish, it fails it.
- **The bump regenerates the lockfile and asserts it moved.** Rewriting `package.json` alone yields a pin that says one thing and installs another — more dangerous than not bumping.
- **The bot PR emits no bypass token.** Its receipt-gate reference is OMN-16887, in the title and the body. A bot is exactly the actor that should not be minting bypasses.
- **Consumers are registered, never discovered.** Discovery is how a consumer gets silently dropped, which is Stall 1 wearing a different hat.
