// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT

/**
 * Types for `manifest.js`.
 *
 * The ESLint rules are plain JavaScript — ESLint loads the config and its
 * plugins directly, with no TypeScript step in front of them, and a build step
 * between a lint rule and the lint run is a way for the two to disagree. But
 * `scripts/check-generated-artifacts.ts` is TypeScript and reads the same
 * module, so the shared surface gets declared types rather than an implicit
 * `any` that would launder every field access.
 */

export interface GeneratedArtifactEntry {
  /** Anchored regular expression matched against a repo-relative, `/`-separated path. */
  readonly pattern: string;
  /** The declared source this artifact is compiled from. */
  readonly source: string;
  /** The command that regenerates it. */
  readonly regenerate: string;
  /** The checker that proves it equals a fresh compile of its source. */
  readonly parity_checker: string;
  /** How that checker establishes parity. */
  readonly parity_mechanism?: string;
  /** Anything a reader needs in order not to re-litigate the entry. */
  readonly note?: string;
}

export interface GeneratedArtifactManifest {
  readonly artifacts: readonly GeneratedArtifactEntry[];
}

export declare const BANNER: string;
export declare const BANNER_HEADER_LINES: number;
export declare function loadManifest(): GeneratedArtifactManifest;
export declare function declaredFor(repoRelative: string): GeneratedArtifactEntry | undefined;
export declare function hasBanner(text: string): boolean;
