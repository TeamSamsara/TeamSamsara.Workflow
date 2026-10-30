// File : /TeamSamsara.Workflow/app/src/views/settings/task-setup/taskSetupViewContent.ts
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : The words on Settings → Tasks and events.

export const TaskSetupViewText = {
  title: "Tasks and events",
  description:
    "Every task has a title, notes, a due time, who it's given to, a status, and can need approval. Here you set the lists those choices come from.",
  readOnly: "Only members with Manage settings can change these lists.",
  loadFailed: "These lists couldn't be loaded.",
  orderFailed: "The new order couldn't be saved.",
  statuses: {
    title: "Statuses",
    description: "The steps a task moves through, in order.",
    add: "Add status",
    countsAs: (category: string) => `Counts as ${category.toLowerCase()}`,
    startsHere: "New tasks start here",
    empty:
      "No statuses yet. Tasks need at least one open and one finished status.",
    addStarting: "Add the starting statuses",
    addingStarting: "Adding…",
    startingFailed: "The starting statuses couldn't be added.",
  },
  eventTypes: {
    title: "Event types",
    description:
      "Kinds of events on the calendar, like a match, a content drop or a meeting. Each has a colour.",
    add: "Add event type",
    empty: "No event types yet. Add the kinds of events your team plans.",
  },
  tags: {
    title: "Tags",
    description:
      "Labels you can put on any task to group and filter them. Each has a colour.",
    add: "Add tag",
    empty: "No tags yet. Add the labels your team wants to sort tasks by.",
  },
} as const;
