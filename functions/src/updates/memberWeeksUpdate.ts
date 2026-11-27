// File : /TeamSamsara.Workflow/functions/src/updates/memberWeeksUpdate.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload-b
// Author : Gerrah
// Purpose : The 1.2 platform update that works out everyone's weeks once
// (memberWeeks), so Reassign, claiming and group pages show who has room
// before anyone's tasks change.

import { saveMemberWeeks } from "../workload/memberWeeks.js";
import type { PlatformUpdate } from "./types.js";

export const memberWeeksUpdate: PlatformUpdate = {
  id: "2026-11-27-member-weeks",
  title: "Work out how full everyone's week is",
  run: async ({ db, dryRun }) => {
    const members = await db
      .collection("members")
      .where("status", "==", "active")
      .get();
    const ids = members.docs.map((doc) => doc.id);
    if (!dryRun) await saveMemberWeeks(db, ids);
    return {
      summary: `${dryRun ? "Would work out" : "Worked out"} the week of ${ids.length} ${ids.length === 1 ? "person" : "people"}.`,
      changed: ids.length,
      notes: [],
    };
  },
};
