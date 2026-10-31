// File : /TeamSamsara.Workflow/app/src/features/events/ui/eventsContent.ts
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : The words for the calendar, its items, the event form, the
// workflows to apply and the tasks they add.

export const CalendarText = {
  previous: "Previous month",
  next: "Next month",
  today: "Today",
  viewLabel: "View",
  views: { month: "Month", list: "List" },
  groupLabel: "Work group",
  allGroups: "All work groups",
  newEvent: "New event",
  newTask: "New task",
  weekdays: {
    monday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    sunday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  addOn: (day: string) => `New event on ${day}`,
  legend:
    "Events have a solid coloured edge; one-off tasks are dashed. Past events fade, with a ✓ when every task got done. Times are in the workspace's time zone.",
  emptyList: "Nothing planned this month.",
  loading: "Loading the calendar",
} as const;

export const CalendarItemText = {
  progress: (done: number, total: number) => `${done}/${total} done`,
  allDone: "All done",
  left: (count: number) => `${count} left`,
  late: "Late",
  repeats: "Repeats",
  skipped: "Skipped",
} as const;

export const EventFormText = {
  title: "Title",
  titlePlaceholder: "vs. Team Nova",
  titleRequired: "Give the event a title.",
  type: "Event type",
  noType: "No type",
  typeHelp:
    "Colours the event on the calendar, and suggests the workflows made for this type.",
  date: "Date",
  dateRequired: "Pick a date.",
  time: "Time",
  link: "Link",
  linkPlaceholder: "https://",
  linkHelp: "Where to watch or join. Fills {link} in the tasks' text.",
  linkInvalid: "That doesn't look like a web address.",
  notes: "Notes",
  notesPlaceholder: "Anything the team should know.",
  details: "Details for the tasks",
  detailsHelp:
    "The workflows you picked have gaps like {opponent} in their text. What you type here fills them in.",
} as const;

export const WorkflowPickerText = {
  title: "Workflows to apply",
  description:
    "Each workflow adds its tasks, due at times counted from the event's start.",
  tasks: (count: number) => (count === 1 ? "1 task" : `${count} tasks`),
  suggested: "Suggested for this type",
  none: "No workflows yet. Make one in Workflows, or plan the event without.",
  max: (count: number) => `Up to ${count} workflows per event.`,
} as const;

export const TaskPreviewText = {
  title: "Tasks this adds",
  none: "Pick a workflow to add its tasks, or plan the event without any.",
  pickDate: "Pick a date to see when each task is due.",
  unassigned: "No one yet",
} as const;
