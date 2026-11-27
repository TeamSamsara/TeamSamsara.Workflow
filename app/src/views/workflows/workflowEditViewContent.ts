// File : /TeamSamsara.Workflow/app/src/views/workflows/workflowEditViewContent.ts
// Version : 1.5.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : The words on the workflow editor page.

export const WorkflowEditViewText = {
  workflows: "Workflows",
  newTitle: "New workflow",
  untitled: "Untitled workflow",
  loading: "Loading workflow",
  notFound: "That workflow doesn't exist any more.",
  backToList: "Back to workflows",
  views: { label: "Show the steps as", list: "List", flow: "Flow" },
  previewOpen: "Preview on a date",
  preview: {
    title: "Preview on a date",
    description:
      "The tasks this workflow, as it is now, would make for an event starting then. Nothing is created.",
    date: "Event starts on",
    time: "At",
    close: "Close",
    eventTitle: "Your event",
    pickDate: "Pick a date and a time to see the tasks.",
    noTasks: "This workflow has no steps yet.",
    count: (count: number) => (count === 1 ? "1 task." : `${count} tasks.`),
    summary: (count: number, first: string, last: string) =>
      `${count === 1 ? "1 task" : `${count} tasks`}, from ${first} to ${last}.`,
    late: (titles: readonly string[]) =>
      titles.length === 1
        ? `${titles[0]} would already be late. Pick a later date, or make it due later.`
        : `${titles.length} tasks would already be late: ${titles.join(", ")}. Pick a later date, or make them due later.`,
    flowLabel: "The tasks this workflow would make, as a flow",
    noDue: "No due time",
    anyoneIn: (group: string) => `Someone in ${group}`,
    nobody: "Not given to anyone",
    lateFromStart: "Late from the start",
    weekNote: "The pill shows how full that week already is",
    stillNote: "Tasks nobody has room for would wait for someone in the group.",
  },
  export: "Export",
  archive: "Archive",
  restore: "Restore",
  delete: "Delete",
  reset: "Reset",
  save: "Save",
  create: "Create workflow",
  saved: (name: string) => `${name} saved`,
  upcomingFollow:
    "Upcoming events that use it update in a moment. Due times never move on their own.",
  created: (name: string) => `${name} created`,
  archived: (name: string) => `${name} archived`,
  restored: (name: string) => `${name} restored`,
  deleted: (name: string) => `${name} deleted`,
  actionFailed: "That didn't work",
  readOnly: "Only members with Edit workflows can change this workflow.",
  archivedNote:
    "This workflow is archived: it isn't offered when planning events. Restore it to use it again.",
  problems: (count: number) =>
    count === 1
      ? "1 thing needs fixing before saving."
      : `${count} things need fixing before saving.`,
  imported: (dropped: number) =>
    dropped === 0
      ? "Imported. Check it over, then create it."
      : `Imported. ${dropped} ${dropped === 1 ? "thing that points" : "things that point"} at groups, people, tags, event types or platforms this workspace doesn't have ${dropped === 1 ? "was" : "were"} left out.`,
  exportFirst: "Save your changes to export them.",
  nextSteps: {
    title: "Your workflow is ready.",
    body: "Open any task to add what to post, a checklist, links, or to ask for approval. Save when you're done.",
    dismiss: "Got it",
  },
  discard: {
    title: "Discard your changes?",
    body: "This workflow has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
  confirmDelete: {
    title: (name: string) => `Delete ${name}?`,
    body: "Tasks already made from it stay as they are. This can't be undone.",
    cancel: "Cancel",
    confirm: "Delete workflow",
  },
} as const;
