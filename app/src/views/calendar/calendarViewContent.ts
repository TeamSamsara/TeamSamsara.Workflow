// File : /TeamSamsara.Workflow/app/src/views/calendar/calendarViewContent.ts
// Version : 1.5.0
// Latest commit: feature/lean-calendar
// Author : Gerrah
// Purpose : The words on the calendar page.

export const CalendarViewText = {
  menu: {
    event: "Event",
    eventDetail: "One event, or one that repeats.",
    several: "Several events",
    severalDetail: "Many dates at once, one row per event.",
    personal: "Personal appointment",
    personalDetail: "Only you and managers see what it is.",
    personalOnly: "Personal appointment",
  },
  taskCreated: (title: string) => `${title} created`,
  unavailable: "Unavailable",
  showTasks: "Show tasks",
  showTasksHelp: {
    mine: "Yours and your groups'",
    groups: "Your groups' tasks",
    group: "This group's one-off tasks",
    all: "Every one-off task",
  },
  tasksHidden:
    "Showing events and personal appointments. The badge on an event is how many of its tasks are done; open it to see them, or turn on Show tasks.",
  mineLegend:
    "My calendar: events you're in, yourself or with your groups, events for everyone, the ones you made, your open tasks and your personal appointments (dashed, with a lock). Outlined events are ones you're in yourself; striped hours are when you're usually unavailable.",
  groupLegend:
    "Events for this group and for everyone. Its one-off tasks show to people who can see every task.",
} as const;
