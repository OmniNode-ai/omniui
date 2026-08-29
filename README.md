# omniui

OmniNode's shared web component library and rendering runtime: a stateless, browser-safe renderer that draws generic component types (charts, tables, status grids, metric clusters, event feeds) from versioned widget contracts and a shared design-token theme catalog, so every host surface that instantiates it renders from the same source of visual truth instead of hand-forking components per app.

## Where this repo is

Phase 1A of the omnidash component rework (epic OMN-16879). Phase 1A produces a **workspace**, not components — its success condition is *"the operator can sit down and author components"*, and D5 assigns authoring of the component types and the token values to the operator in Phase 1B. What is here today is the seam those components bind.

| Landed | Ticket |
|---|---|
| Repo baseline — README, LICENSE, CODEOWNERS, CI skeleton | OMN-16879 |
| Real build / test / lint / typecheck / Storybook workspace, and the theme binding | OMN-16885 |
| Captured contract + projection fixtures, and the TS mirror freshness gate | OMN-16889 |
| The token compile pipeline, deterministic and drift-gated | OMN-16886 |
| Five scoped semantic-token lint rules, wired as CI | OMN-16888 |

## Working in it

```bash
npm ci
npm run lint        # eslint, flat config, no warn-only rules
npm run typecheck   # tsc --noEmit, strict + exactOptionalPropertyTypes
npm test            # vitest, jsdom
npm run build       # tsc -> dist/ (ESM + .d.ts)
npm run storybook   # the Style Reference Guide, live
npm run build-storybook

npm run compile:tokens        # themes/ -> src/generated/tokens/**
npm run check:tokens          # G1A.3: compiled artifacts vs a fresh compile
npm run generate:onex-models  # schema/onex-models.json -> src/generated/onex-models.ts
npm run check:generated       # every generated artifact is declared with a parity checker
```

CI runs on GitHub-hosted runners in two jobs, `build` and `test`, and those are the two required status checks on `main`. **Do not rename them** — branch protection pins the contexts by name, so a rename removes the gate instead of failing. `lint` and `typecheck` run inside `build` for the same reason: a sibling job would be a check nobody is required to pass.

## The theme binding

`ModelRendererThemeContract` (omnibase_core) is a *schema* — it says what a theme must contain and holds no values. `ModelThemeInstance` (OMN-16882) is the *values*. `ThemeProvider` is the first runtime consumer either has ever had:

```tsx
import { ThemeProvider, tokenRef } from '@omninode/omniui';

<ThemeProvider theme={activatedInstance}>
  <div style={{ background: tokenRef('color_background_primary') }} />
</ThemeProvider>
```

Three properties are deliberate:

- **It is pure.** The provider fetches nothing, subscribes to nothing, and holds no state across calls. A host resolves the instance from the catalog through whatever transport that host uses and passes the result in — the requirement `ProtocolRenderer` places on anything calling itself a renderer.
- **There is no default theme.** `useTheme()` outside a provider throws. A component that could invent a value is a component that can drift from the catalog, which is precisely what the uniformity gate exists to detect.
- **Every rendered surface reports its own provenance.** The provider stamps `--onex-theme-id`, `--onex-theme-revision`, `--onex-theme-schema-version`, and `--onex-theme-digest` alongside the tokens. Digest agreement — not version agreement — is what gate G-U1 compares across surfaces, because two surfaces can agree on a version number while loading different bytes.

## Tokens

A token **value** never lives in code. It lives in a `ModelThemeInstance` document upstream in `omnibase_core` (`contracts/themes/<theme_id>/<revision>.yaml`, OMN-16882), and `themes/theme-catalog.capture.json` is this repo's capture of that catalog — the compiler's only input.

```text
ModelRendererThemeContract     schema: what a theme must contain, no values
        │ validates
ModelThemeInstance             values: onex.theme.dark / .light / .warm
        │ themes/theme-catalog.capture.json (captured, digested by the catalog)
        │ npm run compile:tokens
        ├── src/generated/tokens/<id>.css            [data-onex-theme='<id>'] { --onex-*: ... }
        ├── src/generated/tokens/<id>.ts             typed Theme, digest attached
        ├── src/generated/tokens/tailwind/<id>.css   Tailwind v4 @theme — omniweb only (D7)
        └── src/generated/tokens/index.{ts,json}     barrel + digest index
```

Three rules, each with a gate behind it:

- **Deterministic.** Two compile runs are byte-identical, per artifact and in aggregate. No clock, no absolute path, no environment value ever reaches an artifact — the compiler is a pure function from a catalog to a file map, which is what lets a test call it twice and compare. (**G1A.2**)
- **Never hand-edited.** `npm run check:tokens` compares every checked-in artifact to a fresh compile, byte for byte, and runs inside the required `build` job. Changing a token value is a new instance revision upstream, never an edit here. (**G1A.3**)
- **Digest-carried, not digest-recomputed.** Each artifact carries the catalog's own `content_digest` for the instance it compiles. A consumer that recomputes its own digest can only ever agree with itself.

## Token purity rules

Five scoped rules ship as the local `onex` ESLint plugin (`eslint-rules/`). Each declares **what it inspects, what counts as a violation, and what is out of scope** — in the rule, not in a reviewer's head.

| Rule | Catches | Deliberately does not catch |
|---|---|---|
| `onex/no-color-inline` | a colour literal on a CSS colour property, in a `className`, or as any unmistakably-colour value | `transparent`, `currentColor`, `var(--onex-*)`, chart/SVG paint (that is the next rule's) |
| `onex/no-spacing-inline` | a raw `px`/`rem`/`em` on a layout-spacing property | `1px` hairlines, `0`, `auto`, percentages, viewport units, SVG coordinate systems |
| `onex/no-unsourced-css` | a colour or spacing literal in hand-authored CSS | generated artifacts; geometry; non-CSS template literals |
| `onex/svg-and-chart-inputs` | a colour literal on `fill`/`stroke`/`stopColor`, a series/axis/grid/threshold colour, a literal palette array | `viewBox`, `d`, `cx/cy/r`, `strokeWidth`, `transform` — coordinates are not design tokens |
| `onex/generated-artifact-parity` | a generated artifact no parity checker covers, and a declared artifact that lost its banner | nothing |

The first four **partition** the space rather than overlapping: one literal is reported by exactly one rule. A literal reported twice is noise, and noise is what earns a rule a blanket disable comment.

Every rule is `error`; there is no warn-only mode. The single exemption is `// onex-token-exempt: <reason>` on the reported line or in the comment block directly above it, and **a reason is mandatory** — an allowlist entry nobody can read is one nobody can remove. The allowlist only shrinks.

`generated-artifact-parity` has an honest split, stated in the rule itself: the **byte** comparison lives in `npm run check:tokens` (which recompiles from source) and in `src/generated/mirror-freshness.test.ts`. What the ESLint rule adds is coverage — an artifact nothing can re-derive can be hand-patched while every other rule passes. ESLint 9 has no CSS language, so `npm run check:generated` walks the whole tree by bytes and catches the compiled `.css` artifacts the rule cannot see.

## Layout

```text
eslint-rules/   the local `onex` ESLint plugin: five scoped semantic-token rules
themes/         the captured theme catalog — the token compiler's only input
src/tokens/     the token compiler (pure; scripts/compile-tokens.ts does the I/O)
src/generated/  generated artifacts: the ONEX TS mirror and the compiled tokens
src/fixtures/   captured contract + projection fixtures
src/theme/      the theme binding: token -> CSS custom property, provider, hook
src/renderer/   (Phase 1B+) generic component types parameterized by widget contracts
.storybook/     Storybook config; the Style Reference Guide is a story, not a doc
```

`src/theme/theme-fixtures.ts` holds hand-built themes for tests and stories. They are **not** the catalog and are deliberately not exported from the package — a consumer that could import a fixture theme could ship one, and a shipped fixture is a token value with no catalog entry behind it.

## Reference

`omni_home/docs/plans/2026-08-27-omnidash-component-rework-plan.md` — §2.1 (token layer), §2.5 (the renderer as a hosted library), §4 Phase 1A.
