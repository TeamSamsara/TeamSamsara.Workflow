// File : /TeamSamsara.Workflow/app/src/views/calendar/calendarViewContent.ts
// Version : 1.7.0
// Latest commit: feature/1.2-calendars-lists
// Author : Gerrah
// Purpose : The words on the calendar page.

export const CalendarViewText = {
  calendars: "Calendars",
  menu: {
    event: "Event",
    eventDetail: "One event, or one that repeats.",
    several: "Several events",
    severalDetail: "Many dates at once, one row per event.",
    personal: "Personal appointment",
    personalDetail:
      "Only you see what it is, unless you share it with your group leads.",
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

export const CalendarsViewText = {
  title: "Calendars",
  description:
    "Every calendar you can open. Calendar in the menu opens My calendar.",
  newEvent: "New event",
  yours: "Yours",
  everyone: "Everyone",
  everyoneNote:
    "You can see every event, so every group's calendar is here too.",
  mine: "My calendar",
  fromMenu: "Opens from the menu",
  mineDescription:
    "The events you're in, yourself or through your groups, events for everyone, the ones you made and your appointments.",
  allMyGroups: "All my groups",
  allMyGroupsDescription: "Every event for any of your groups, together.",
  yourGroup: "Your group",
  groupDescription: "Its events, and its tasks when Show tasks is on.",
  everything: "Everything",
  everythingDescription:
    "Every event in the workspace, from every group and person.",
  thisWeek: "This week",
  events: (count: number) => (count === 1 ? "1 event" : `${count} events`),
  next: (title: string, when: string) => `Next: ${title} · ${when}`,
  open: "Open",
} as const;
