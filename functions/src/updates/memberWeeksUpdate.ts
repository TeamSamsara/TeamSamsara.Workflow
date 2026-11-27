// File : /TeamSamsara.Workflow/functions/src/updates/memberWeeksUpdate.ts
// Version : 1.2.0
// Latest commit: feature/1.2-workload-checks
// Author : Gerrah
// Purpose : The 1.2 platform update that works out everyone's weeks once
// (memberWeeks), so Reassign, claiming and group pages show who has room
// before anyone's tasks change, and gives every open task the week it's due
// in (weekKey), for the rules' room check.

import {
  keepAllWeekKeys,
  saveGroupWeeks,
  saveMemberWeeks,
} from "../workload/memberWeeks.js";
import type { PlatformUpdate } from "./types.js";

export const memberWeeksUpdate: PlatformUpdate = {
  id: "2026-11-27-member-weeks",
  title: "Work out how full everyone's and every group's week is",
  run: async ({ db, dryRun }) => {
    const members = await db
      .collection("members")
      .where("status", "==", "active")
      .get();
    const ids = members.docs.map((doc) => doc.id);
    const groups = (await db.collection("workGroups").get()).docs.map(
      (doc) => doc.id,
    );
    let tasks = 0;
    if (!dryRun) {
      await saveMemberWeeks(db, ids);
      await saveGroupWeeks(db, groups);
      tasks = await keepAllWeekKeys(db);
    }
    return {
      summary: `${dryRun ? "Would work out" : "Worked out"} the week of ${ids.length} ${ids.length === 1 ? "person" : "people"} and ${groups.length} ${groups.length === 1 ? "group" : "groups"}.`,
      changed: ids.length + groups.length + tasks,
      notes: dryRun
        ? []
        : [`Gave ${tasks} open tasks the week they're due in.`],
    };
  },
};
