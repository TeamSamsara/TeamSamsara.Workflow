// File : /TeamSamsara.Workflow/app/src/views/tasks/myTasksViewContent.ts
// Version : 1.2.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The words on My tasks.

import type { TaskScope } from "@/features/tasks";

export const MyTasksViewText = {
  title: "My tasks",
  description:
    "What's yours to do next. Everything coming up is in Planning, and what's finished is in Done this week.",
  scopeLabel: "Whose tasks",
  scopes: {
    mine: "Mine",
    groups: "My groups",
    pick: "Pick groups",
  } satisfies Record<TaskScope, string>,
  pickLabel: "Groups to show",
  pickNone: "Tick the groups to show their tasks.",
  noGroups: "You're not in a work group yet.",
  viewsLabel: "How much",
  views: {
    focus: "Focus",
    planning: "Planning",
    done: "Done this week",
  },
  newTask: "New task",
  created: (title: string) => `${title} created`,
  loading: "Loading your tasks",
  emptyTitle: "Nothing to do",
  emptyBody:
    "Tasks given to you or your work groups show up here, grouped by when they're due.",
  focusEmptyTitle: "Nothing due this week",
  focusEmptyBody: "Nothing's late or due in the next 7 days.",
  comingUp: (tasks: number) =>
    tasks === 1 ? "Coming up: 1 later task" : `Coming up: ${tasks} later tasks`,
  comingUpEvents: (events: number) =>
    events === 0
      ? "Open Planning"
      : events === 1
        ? "across 1 event · open Planning"
        : `across ${events} events · open Planning`,
  doneEmptyTitle: "Nothing done yet this week",
  doneEmptyBody: "Tasks show here as soon as they're done.",
  today: "Today",
  yesterday: "Yesterday",
  doneBy: (name: string) => `Done by ${name}`,
  approvedBy: (name: string) => `approved by ${name}`,
  approvedByStart: (name: string) => `Approved by ${name}`,
  waiting: (group: string) => `Waiting for someone in ${group}`,
  waitingNote:
    "No one was free for these yet. Claim one to take it, or it goes to the first person who frees up.",
  claim: "Claim",
  claimed: (title: string) => `${title} is yours`,
  claimFailed: "Couldn't claim that task",
  approvals: "Waiting for your approval",
  noApprovals: "Nothing waiting for approval.",
  dayLetters: {
    monday: ["M", "T", "W", "T", "F", "S", "S"],
    sunday: ["S", "M", "T", "W", "T", "F", "S"],
  },
} as const;
