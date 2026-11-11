// File : /TeamSamsara.Workflow/app/src/features/events/ui/deleteRepeatContent.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What the dialog for deleting a repeated event says.

import type { SeriesChoice } from "../model/seriesDeletion";

const events = (count: number) => (count === 1 ? "1 event" : `${count} events`);
const tasks = (count: number) => (count === 1 ? "1 task" : `${count} tasks`);

export const DeleteRepeatText = {
  title: (title: string) => `Delete ${title}?`,
  intro: (schedule: string, date: string) =>
    `It repeats ${schedule.charAt(0).toLowerCase()}${schedule.slice(1)} This one is ${date}.`,
  choicesLabel: "Which to delete",
  choices: {
    one: {
      label: "Just this one",
      help: (date: string) => `${date}. The repeat carries on.`,
    },
    later: {
      label: "This and every later one",
      help: (date: string) => `From ${date}. Earlier ones stay.`,
    },
    all: {
      label: "The whole series",
      help: (title: string) =>
        `Every ${title}, past and future, and the repeat itself.`,
    },
  } satisfies Record<
    SeriesChoice,
    { label: string; help: (value: string) => string }
  >,
  checking: "Counting what it deletes…",
  readFailed: "Couldn't count what it deletes",
  summary: (eventCount: number, taskCount: number) =>
    `Deletes ${events(eventCount)} and ${tasks(taskCount)}`,
  taskLine: (total: number, finished: number) =>
    total === 0
      ? "No tasks on them."
      : finished === 0
        ? `${tasks(total)} on them, none finished yet.`
        : `${tasks(total)} on them, ${finished} finished.`,
  keepDone: "Keep the finished tasks as history",
  keepDoneHelp: (title: string, date: string) =>
    `They stay in people's done lists, marked "Event deleted: ${title}, ${date}".`,
  cancel: "Cancel",
  confirm: (count: number) => `Delete ${events(count)}`,
  deleted: (count: number) => `Deleted ${events(count)}`,
  failed: "Couldn't delete",
} as const;
