// File : /TeamSamsara.Workflow/app/src/views/calendar/calendarViewContent.ts
// Version : 1.5.0
// Latest commit: fix/private-appointments
// Author : Gerrah
// Purpose : The words on the calendar page.

export const CalendarViewText = {
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
  mineLegend:
    "My calendar: events you're in, yourself or with your groups, events for everyone, the ones you made, your open tasks and your personal appointments (dashed, with a lock). Outlined events are ones you're in yourself; striped hours are when you're usually unavailable.",
  groupLegend:
    "Events for this group and for everyone. Its one-off tasks show to people who can see every task.",
} as const;
