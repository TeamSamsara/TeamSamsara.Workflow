// File : /TeamSamsara.Workflow/releases/index.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Every release of Playbook, newest first, as people read about it
// in What's new. The notes are written together before each release (see
// README.md); none are written yet.

import type { Release } from "./types.js";

export type { ChangeKind, Release, ReleaseChange } from "./types.js";
export { ChangeKinds } from "./types.js";
export {
  compareVersions,
  highlightsOf,
  latestRelease,
  releaseForViewer,
  unseenRelease,
} from "./model.js";

export const releases: readonly Release[] = [];
