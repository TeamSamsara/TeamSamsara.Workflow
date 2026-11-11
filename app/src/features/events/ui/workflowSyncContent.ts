// File : /TeamSamsara.Workflow/app/src/features/events/ui/workflowSyncContent.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What the "Update the tasks it made?" dialog says after a workflow
// is saved.

import type { LeftAloneReason, SyncPart } from "../model/workflowSync";

const tasks = (count: number) => (count === 1 ? "1 task" : `${count} tasks`);

export const WorkflowSyncText = {
  title: "Update the tasks it made?",
  usedBy: (count: number) =>
    count === 1
      ? "is used by 1 upcoming event."
      : `is used by ${count} upcoming events.`,
  yourChanges: "Your changes:",
  checking: "Checking the upcoming tasks…",
  readFailed: "Couldn't check the upcoming tasks",
  willUpdate: (count: number) => `Will update · ${count}`,
  alreadyLate: (count: number) => `Would already be late · ${count}`,
  lateDetail: (when: string, keeps: string) =>
    `The new time, ${when}, has passed. It keeps ${keeps}.`,
  moveAnyway: "Move it anyway (it becomes late)",
  leftAlone: (count: number) => `Left as they are · ${count}`,
  reasons: {
    done: "done",
    edited: "changed by hand",
    stepRemoved: "its task was removed from the workflow",
  } satisfies Record<LeftAloneReason, string>,
  editedParts: (parts: string) => `its ${parts}`,
  textOnly: "New wording",
  parts: {
    due: "due time",
    title: "title",
    notes: "notes",
    checklist: "checklist",
    posts: "post text",
  } satisfies Record<SyncPart, string>,
  keptNote: (parts: string) => `Its ${parts} stays as it was changed by hand.`,
  showAll: (count: number) => `Show all ${count}`,
  showFewer: "Show fewer",
  newEventsNote:
    "Events planned from now on use the new version either way. Who a task is given to only changes for new events.",
  onlyNew: "Only new events",
  update: (count: number) =>
    count === 0 ? "Nothing to update" : `Update ${tasks(count)}`,
  updated: (count: number) => `Updated ${tasks(count)}`,
  updateFailed: "Couldn't update the tasks",
  stepDue: (title: string, due: string) => `${title} is now due ${due}.`,
  stepWording: (title: string) => `${title} has new wording.`,
} as const;
