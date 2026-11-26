// File : /TeamSamsara.Workflow/releases/model.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Reading the release notes: which is the latest, which one a
// person hasn't seen yet, what an Administrator sees that others don't, and
// what goes in the What's new panel.

import type { Release, ReleaseChange } from "./types.js";

/** "1.10.0" after "1.9.2": compares each number in turn. */
export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** The newest release, whatever order the list is in. */
export function latestRelease(releases: readonly Release[]): Release | null {
  return (
    [...releases].sort((a, b) => compareVersions(b.version, a.version))[0] ??
    null
  );
}

/** A release with only what this person may see. */
export function releaseForViewer(release: Release, isAdmin: boolean): Release {
  return {
    ...release,
    changes: release.changes.filter(
      (change) => isAdmin || change.audience !== "admins",
    ),
  };
}

/**
 * The release to show someone once: the latest, if they haven't seen it. A
 * person who joined after it came out has nothing to catch up on.
 */
export function unseenRelease(
  releases: readonly Release[],
  lastSeen: string | null,
  joinedOn: string | null,
): Release | null {
  const latest = latestRelease(releases);
  if (!latest) return null;
  if (lastSeen && compareVersions(lastSeen, latest.version) >= 0) return null;
  if (!lastSeen && joinedOn && joinedOn > latest.date) return null;
  return latest;
}

/** What the panel steps through: the highlights, or the first few new things. */
export function highlightsOf(release: Release, most = 5): ReleaseChange[] {
  const marked = release.changes.filter((change) => change.highlight);
  const picked = marked.length
    ? marked
    : release.changes.filter((change) => change.kind === "new");
  return (picked.length ? picked : release.changes).slice(0, most);
}
