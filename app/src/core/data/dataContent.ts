// File : /TeamSamsara.Workflow/app/src/core/data/dataContent.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : What people read when loading or saving data goes wrong, one line per
// kind of problem.

import type { DataErrorKind } from "./dataErrors";

export const DataErrorText: Record<DataErrorKind, string> = {
  offline:
    "You seem to be offline. Your changes are kept and will save when the connection is back.",
  notAllowed: "You don't have permission to do this.",
  notFound: "This no longer exists. It may have been deleted.",
  conflict: "Someone changed this at the same time. Reload and try again.",
  unknown: "Something went wrong. Try again in a moment.",
};
