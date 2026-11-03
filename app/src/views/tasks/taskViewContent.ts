// File : /TeamSamsara.Workflow/app/src/views/tasks/taskViewContent.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The words on a task's page.

export const TaskViewText = {
  myTasks: "My tasks",
  loading: "Loading task",
  notFound: "This task doesn't exist any more, or it isn't shared with you.",
  back: "Back to My tasks",
  edit: "Edit",
  delete: "Delete",
  cancel: "Cancel",
  save: "Save",
  saved: (title: string) => `${title} saved`,
  deleted: (title: string) => `${title} deleted`,
  editTitle: "Edit task",
  noDetails: "No instructions, post text or checklist yet.",
  confirmDelete: {
    title: (title: string) => `Delete ${title}?`,
    body: "This can't be undone.",
    confirm: "Delete task",
  },
  discard: {
    title: "Discard your changes?",
    body: "This task has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;
