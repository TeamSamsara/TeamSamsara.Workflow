// File : /TeamSamsara.Workflow/app/src/views/calendar/calendarViewContent.ts
// Version : 1.1.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The words on the calendar page.

export const CalendarViewText = {
  taskCreated: (title: string) => `${title} created`,
  mineLegend:
    "My calendar: events you're in, yourself or with your groups, events for everyone, the ones you made, and your open tasks. Outlined events are ones you're in yourself.",
  groupLegend:
    "Events for this group and for everyone. Its one-off tasks show to people who can see every task.",
} as const;
