// File : /TeamSamsara.Workflow/app/src/views/events/newEventViewContent.ts
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : The words on the New event page.

export const NewEventViewText = {
  calendar: "Calendar",
  title: "New event",
  event: "Event",
  cancel: "Cancel",
  create: (tasks: number) =>
    tasks === 0
      ? "Create event"
      : `Create event and ${tasks === 1 ? "1 task" : `${tasks} tasks`}`,
  createRepeat: (events: number, tasks: number) =>
    `Create ${events === 1 ? "1 event" : `${events} events`}${tasks === 0 ? "" : ` and ${tasks === 1 ? "1 task" : `${tasks} tasks`}`}`,
  createRepeatPlain: "Create repeat",
  created: (title: string) => `${title} planned`,
  createdRepeat: (title: string) => `${title} planned as a repeat`,
  failed: "The event couldn't be created",
  noStatuses:
    "Add statuses in Settings → Tasks and events before planning events with tasks.",
  problems: "Fix the highlighted fields to continue.",
  discard: {
    title: "Leave without planning it?",
    body: "What you've filled in won't be kept.",
    keep: "Keep going",
    confirm: "Leave",
  },
} as const;
