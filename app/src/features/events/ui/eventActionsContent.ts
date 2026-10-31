// File : /TeamSamsara.Workflow/app/src/features/events/ui/eventActionsContent.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : The words for an event's ⋯ menu and the dialogs it opens.

export const EventActionsText = {
  menu: (title: string) => `Options for ${title}`,
  actions: {
    edit: "Edit",
    delete: "Delete",
    editOne: "Edit this one",
    editUpcoming: "Edit this and upcoming",
    skip: "Skip this one",
    end: "End the repeat",
    deleteOne: "Delete this one",
  },
  saved: (title: string) => `${title} saved`,
  deleted: (title: string) => `${title} deleted`,
  skipped: (date: string) => `${date} skipped`,
  ended: (date: string) => `The repeat now ends on ${date}`,
  savedSeries: (title: string) => `${title} and the upcoming ones saved`,
  cancel: "Cancel",
  loadingTasks: "Checking its tasks",
  editDialog: {
    title: "Edit event",
    titleOne: "Edit this one",
    oneNote: "Only this date changes; the rest of the repeat stays as it is.",
    moveTasks: "Move its tasks too",
    moveTasksHelp: "Its tasks keep the same time before or after the event.",
    save: "Save",
  },
  seriesDialog: {
    title: "Edit this and upcoming",
    from: (date: string) =>
      `Changes apply from ${date} on. Earlier events stay as they were.`,
    moves:
      "Upcoming events keep their tasks; if the time changes, their tasks move with it. Events on days no longer picked are removed with their tasks.",
    save: "Save",
  },
  deleteDialog: {
    title: (title: string) => `Delete ${title}?`,
    body: (tasks: number) =>
      tasks === 0
        ? "This can't be undone."
        : `Its ${tasks === 1 ? "task" : `${tasks} tasks`} will be deleted too. This can't be undone.`,
    confirm: "Delete event",
  },
  skipDialog: {
    title: (date: string) => `Skip ${date}?`,
    titleDelete: (date: string) => `Delete ${date}?`,
    body: (tasks: number) =>
      `This date's event${tasks === 0 ? "" : ` and its ${tasks === 1 ? "task" : `${tasks} tasks`}`} will be removed, and the repeat won't make it again. The other dates stay.`,
    confirm: "Skip it",
    confirmDelete: "Delete it",
  },
  endDialog: {
    title: "End the repeat?",
    body: (date: string, later: number) =>
      later === 0
        ? `${date} will be the last one. Nothing after it is planned yet.`
        : `${date} will be the last one. The ${later === 1 ? "event" : `${later} events`} planned after it will be removed with their tasks.`,
    confirm: "End after this one",
  },
} as const;
