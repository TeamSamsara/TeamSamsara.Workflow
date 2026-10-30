// File : /TeamSamsara.Workflow/app/src/views/events/eventViewContent.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : The words on an event's page and its edit and delete dialogs.

export const EventViewText = {
  calendar: "Calendar",
  loading: "Loading event",
  notFound: "This event doesn't exist any more.",
  back: "Back to the calendar",
  edit: "Edit event",
  delete: "Delete",
  addTask: "Add task",
  openLink: "Open link",
  tasks: "Tasks",
  progress: (done: number, total: number) => `${done} of ${total} done`,
  noTasks: "No tasks yet.",
  limited: "Only the tasks given to you or your work groups show here.",
  details: "Details",
  type: "Type",
  noType: "No type",
  link: "Link",
  workflows: "Workflows",
  noWorkflows: "None",
  notes: "Notes",
  taskAdded: (title: string) => `${title} added`,
  saved: (title: string) => `${title} saved`,
  deleted: (title: string) => `${title} deleted`,
  editDialog: {
    title: "Edit event",
    moveTasks: "Move its tasks too",
    moveTasksHelp: "Its tasks keep the same time before or after the event.",
    cancel: "Cancel",
    save: "Save",
  },
  deleteDialog: {
    title: (title: string) => `Delete ${title}?`,
    body: (tasks: number) =>
      tasks === 0
        ? "This can't be undone."
        : `Its ${tasks === 1 ? "task" : `${tasks} tasks`} will be deleted too. This can't be undone.`,
    cancel: "Cancel",
    confirm: "Delete event",
  },
} as const;
