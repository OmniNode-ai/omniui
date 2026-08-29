#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
# SPDX-License-Identifier: MIT
#
# Ticket: OMN-16887 (Phase 1A.3). Epic OMN-16879.
#
# THIS SCRIPT IS GATE G1A.1. It is the whole reason D2b was answered at scaffold
# time instead of deferred, and it must pass BEFORE any real component exists.
#
#   G1A.1 passes when: a scratch consumer OUTSIDE the library's workspace
#   installs the pinned artifact by exact version, verifies its digest and
#   provenance, renders a component, and can roll back to a prior version by
#   moving the pin.
#
#   G1A.1 is falsified by: any path that only works via a workspace/relative
#   link; any consumer that cannot verify provenance; any version that can be
#   re-published in place.
#
# Why it is written as a script rather than a checklist: Stall 1 was a package
# that was never installed anywhere, and Stall 3 was a criterion satisfied by a
# closure defined inside its own unit test. Both would have passed a checklist.
#
# Usage:
#   scripts/verify-reachability.sh <package> <new-version> <prior-version>
# Example (the throwaway pair the plan calls for):
#   scripts/verify-reachability.sh @omninode/omniui 0.0.1-alpha.1 0.0.1-alpha.0

set -euo pipefail

PKG="${1:?usage: verify_reachability.sh <package> <new-version> <prior-version>}"
NEW_VERSION="${2:?missing <new-version>}"
PRIOR_VERSION="${3:?missing <prior-version>}"

# Deliberately NOT a path under the repo. A workspace-adjacent directory can
# resolve through a workspace link and pass while proving nothing.
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

echo "==> Scratch consumer: $SCRATCH"
echo "==> Repo root is NOT an ancestor of it: $(cd "$SCRATCH" && pwd)"

cd "$SCRATCH"
npm init -y >/dev/null

fail() { echo "G1A.1 FAILED: $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Exact-version install from the public registry.
# ---------------------------------------------------------------------------
echo "==> [1/6] Installing ${PKG}@${NEW_VERSION} by exact version"
npm install --save-exact "${PKG}@${NEW_VERSION}"

spec="$(node -p "require('./package.json').dependencies['${PKG}']")"
[ "$spec" = "$NEW_VERSION" ] || fail "dependency spec is '${spec}', expected exact '${NEW_VERSION}'"

# ---------------------------------------------------------------------------
# 2. The install must not have resolved through a link. A file:/link: resolution
#    is the exact failure mode G1A.1 exists to catch.
# ---------------------------------------------------------------------------
echo "==> [2/6] Asserting registry resolution, not a workspace/file link"
resolved="$(node -p "require('./package-lock.json').packages['node_modules/${PKG}'].resolved")"
case "$resolved" in
  https://registry.npmjs.org/*) ;;
  *) fail "resolved from '${resolved}', not the public registry" ;;
esac

# ---------------------------------------------------------------------------
# 3. Digest verification. The lockfile integrity must match what the registry
#    reports for that exact version.
# ---------------------------------------------------------------------------
echo "==> [3/6] Verifying integrity digest against the registry"
lock_integrity="$(node -p "require('./package-lock.json').packages['node_modules/${PKG}'].integrity")"
registry_integrity="$(npm view "${PKG}@${NEW_VERSION}" dist.integrity)"
[ "$lock_integrity" = "$registry_integrity" ] \
  || fail "integrity mismatch: lockfile ${lock_integrity} vs registry ${registry_integrity}"
echo "    integrity: ${lock_integrity}"

# ---------------------------------------------------------------------------
# 4. Provenance attestation. D2b's properties are not satisfied by a publish
#    alone -- provenance is only worth having if a consumer checks it.
# ---------------------------------------------------------------------------
echo "==> [4/6] Verifying provenance attestation"
npm audit signatures || fail "provenance/signature verification failed"

# ---------------------------------------------------------------------------
# 5. Render a component FROM THE INSTALLED PACKAGE. G1A.1 says "renders a
#    component", and an install that resolves but cannot be imported and drawn
#    proves reachability of a tarball, not of a library. The import specifier
#    is the bare package name -- never a relative path, which is the whole
#    distinction the gate is written around.
# ---------------------------------------------------------------------------
echo "==> [5/6] Rendering a component from the installed package"
npm install --save-exact react react-dom >/dev/null

cat > render-smoke.mjs <<SMOKE
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { COMPILED_THEMES, ThemeProvider } from '${PKG}';

const theme = COMPILED_THEMES['onex.theme.dark'];
if (theme === undefined) {
  throw new Error('installed package exports no onex.theme.dark');
}

const html = renderToStaticMarkup(
  createElement(ThemeProvider, { theme }, createElement('span', null, 'ok')),
);

for (const expected of [
  'data-onex-theme="onex.theme.dark"',
  '--onex-color-accent-primary',
  theme.identity.contentDigest,
]) {
  if (!html.includes(expected)) {
    throw new Error(\`rendered markup is missing \${expected}\`);
  }
}
process.stdout.write('    rendered, theme-reported, digest-carrying\\n');
SMOKE

node render-smoke.mjs || fail "the installed package did not render a component"

# ---------------------------------------------------------------------------
# 6. Rollback by moving the pin, proving the OLD BYTES come back by digest.
#    "It installed something" is not rollback; the digest is the claim. This
#    runs LAST so the scratch consumer's final state is the rolled-back pin —
#    a rollback followed by a reinstall of the new version proves nothing.
# ---------------------------------------------------------------------------
echo "==> [6/6] Rolling back to ${PRIOR_VERSION} and proving the old bytes returned"
prior_registry_integrity="$(npm view "${PKG}@${PRIOR_VERSION}" dist.integrity)"
npm install --save-exact "${PKG}@${PRIOR_VERSION}"
prior_lock_integrity="$(node -p "require('./package-lock.json').packages['node_modules/${PKG}'].integrity")"
[ "$prior_lock_integrity" = "$prior_registry_integrity" ] \
  || fail "rollback integrity mismatch: ${prior_lock_integrity} vs ${prior_registry_integrity}"
[ "$prior_lock_integrity" != "$lock_integrity" ] \
  || fail "rollback produced the SAME digest as ${NEW_VERSION} -- versions are not distinct artifacts"
echo "    rolled back to integrity: ${prior_lock_integrity}"

echo
echo "G1A.1 PASSED"
echo "  package:        ${PKG}"
echo "  installed:      ${NEW_VERSION} (${lock_integrity})"
echo "  rolled back to: ${PRIOR_VERSION} (${prior_lock_integrity})"
echo "  rendered:       ThemeProvider, from the bare package specifier"
echo "  scratch dir:    ${SCRATCH} (outside the library workspace)"
