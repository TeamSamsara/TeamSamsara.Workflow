// File : /TeamSamsara.Workflow/app/src/views/calendar/calendarViewContent.ts
// Version : 1.2.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : The words on the calendar page.

export const CalendarViewText = {
  taskCreated: (title: string) => `${title} created`,
  unavailable: "Unavailable",
  mineLegend:
    "My calendar: events you're in, yourself or with your groups, events for everyone, the ones you made, your open tasks and your personal appointments (dashed, with a lock). Outlined events are ones you're in yourself; striped hours are when you're usually unavailable.",
  groupLegend:
    "Events for this group and for everyone. Its one-off tasks show to people who can see every task.",
} as const;
