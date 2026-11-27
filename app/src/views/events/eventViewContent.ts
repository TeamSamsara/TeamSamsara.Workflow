// File : /TeamSamsara.Workflow/app/src/views/events/eventViewContent.ts
// Version : 1.5.0
// Latest commit: feature/1.2-flow-view
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
  progressWaiting: (done: number, total: number, waiting: number) =>
    waiting === 0
      ? `${done} of ${total} done`
      : `${done} of ${total} done · ${waiting} waiting for someone`,
  views: { label: "Show the tasks as", list: "List", flow: "Flow" },
  inTimeOrder: "In time order.",
  flow: {
    label: "The event's tasks as a flow",
    noDue: "No due time",
    waiting: "Waiting",
    waitingKey: "Waiting: can start when what it waits for is done",
    waitingForSomeone: (group: string) => `Waiting for someone in ${group}`,
    unassigned: "Not given to anyone",
  },
  noTasks: "No tasks yet.",
  limited: "Only the tasks given to you or your work groups show here.",
  details: "Details",
  audience: "Who's in it",
  type: "Type",
  noType: "No type",
  link: "Link",
  workflows: "Workflows",
  noWorkflows: "None",
  notes: "Notes",
  taskAdded: (title: string) => `${title} added`,
  partOf: "Part of",
  plannedAs: (times: string, city: string) => `(${times} ${city} time)`,
  repeat: "Repeats",
  repeatHelp:
    "Change this one or the upcoming ones, skip a date or end the repeat from the ⋯ menu.",
} as const;
