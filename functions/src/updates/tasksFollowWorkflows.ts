// File : /TeamSamsara.Workflow/functions/src/updates/tasksFollowWorkflows.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The first platform update. Events planned before tasks followed
// their workflows still carry the workflow as it was then: old due times, no
// one given the task, no post text. For every upcoming event, each open task
// is brought in line with its step as it is now. A task nobody has touched
// since it was made is fully refreshed; one someone touched only gets its
// gaps filled (who it's given to, post text, notes, checklist items), and the
// rest is listed in the report. Finished tasks and past events stay as they
// are, and no due time moves to one that has already passed.

import { engineFormats, readWorkflow } from "../engineData.js";
import { syncWorkflow } from "../workflowSync.js";
import type { PlatformUpdate } from "./types.js";

const partNames: Record<string, string> = {
  due: "due time",
  assignee: "who it's given to",
  title: "title",
  notes: "notes",
  checklist: "checklist",
  posts: "post text",
};

export const tasksFollowWorkflows: PlatformUpdate = {
  id: "2026-11-11-tasks-follow-workflows",
  title: "Bring upcoming events' tasks in line with their workflows",
  run: async ({ db, dryRun, now }) => {
    const formats = await engineFormats(db);
    const workflows = await db
      .collection("workflows")
      .where("archived", "==", false)
      .get();
    let changed = 0;
    let events = 0;
    const notes: string[] = [];
    for (const doc of workflows.docs) {
      const after = readWorkflow(doc.id, doc.data());
      const result = await syncWorkflow(db, {
        before: null,
        after,
        dryRun,
        now,
        formats,
      });
      changed += result.updated.length;
      events += result.events;
      for (const entry of result.held) {
        const kept = entry.held
          .map(
            ({ part, reason }) =>
              `${partNames[part] ?? part}${reason === "late" ? " (would already be late)" : ""}`,
          )
          .join(", ");
        notes.push(`${entry.eventTitle} · ${entry.title}: kept its ${kept}`);
      }
    }
    const verb = dryRun ? "Would update" : "Updated";
    return {
      summary: `${verb} ${changed} task${changed === 1 ? "" : "s"} across ${events} upcoming event${events === 1 ? "" : "s"}.`,
      changed,
      notes: notes.slice(0, 100),
    };
  },
};
