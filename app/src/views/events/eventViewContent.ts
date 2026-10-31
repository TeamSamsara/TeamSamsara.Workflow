// File : /TeamSamsara.Workflow/app/src/views/events/eventViewContent.ts
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : The words on an event's page.

export const EventViewText = {
  calendar: "Calendar",
  loading: "Loading event",
  notFound: "This event doesn't exist any more.",
  back: "Back to the calendar",
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
  repeat: "Repeats",
  repeatHelp:
    "Change this one or the upcoming ones, skip a date or end the repeat from the ⋯ menu.",
} as const;
