# omniui

OmniNode's shared web component library and rendering runtime: a stateless, browser-safe renderer that draws generic component types (charts, tables, status grids, metric clusters, event feeds) from versioned widget contracts and a shared design-token theme catalog, so every host surface that instantiates it renders from the same source of visual truth instead of hand-forking components per app.

## Where this repo is

Phase 1A of the omnidash component rework (epic OMN-16879). Phase 1A produces a **workspace**, not components — its success condition is *"the operator can sit down and author components"*, and D5 assigns authoring of the component types and the token values to the operator in Phase 1B. What is here today is the seam those components bind.

| Landed | Ticket |
|---|---|
| Repo baseline — README, LICENSE, CODEOWNERS, CI skeleton | OMN-16879 |
| Real build / test / lint / typecheck / Storybook workspace, and the theme binding | OMN-16885 |

## Working in it

```bash
npm ci
npm run lint        # eslint, flat config, no warn-only rules
npm run typecheck   # tsc --noEmit, strict + exactOptionalPropertyTypes
npm test            # vitest, jsdom
npm run build       # tsc -> dist/ (ESM + .d.ts)
npm run storybook   # the Style Reference Guide, live
npm run build-storybook
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

## Layout

```text
src/theme/      the theme binding: token -> CSS custom property, provider, hook
src/renderer/   (Phase 1B+) generic component types parameterized by widget contracts
.storybook/     Storybook config; the Style Reference Guide is a story, not a doc
```

`src/theme/theme-fixtures.ts` holds hand-built themes for tests and stories. They are **not** the catalog and are deliberately not exported from the package — a consumer that could import a fixture theme could ship one, and a shipped fixture is a token value with no catalog entry behind it.

## Reference

`omni_home/docs/plans/2026-08-27-omnidash-component-rework-plan.md` — §2.1 (token layer), §2.5 (the renderer as a hosted library), §4 Phase 1A.
