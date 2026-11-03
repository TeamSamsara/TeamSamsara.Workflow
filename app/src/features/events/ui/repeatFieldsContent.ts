// File : /TeamSamsara.Workflow/app/src/features/events/ui/repeatFieldsContent.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : The words for setting how an event repeats.

export const RepeatFieldsText = {
  add: "Repeat…",
  addHelp:
    "For things that happen every week, like a content meeting or weekly posts.",
  title: "Repeats",
  remove: "Don't repeat",
  on: "On",
  weekdaysRequired: "Pick at least one day.",
  ends: "Ends",
  endKinds: { never: "Never", onDate: "On a date", afterCount: "After" },
  endDate: "Last date",
  endDateRequired: "Pick the last date.",
  endDateBefore: "Pick a date after the first one.",
  endCount: "Events",
  endCountRange: (max: number) => `Between 1 and ${max}.`,
  skip: "Skip dates",
  skipHelp:
    "Dates it doesn't happen, like a holiday. You can also skip one later from the calendar.",
  skipDate: "Date to skip",
  addSkip: "Skip",
  pickDate: "Pick the first date, the days and the end to see when it happens.",
  preview: (count: number, weeks: number) =>
    count === 0
      ? `Nothing in the next ${weeks} weeks.`
      : `Makes ${count === 1 ? "1 event" : `${count} events`} in the next ${weeks} weeks:`,
  more: (count: number) => `and ${count} more`,
  ahead: (weeks: number) =>
    `Events are made ${weeks} weeks ahead, each with its workflows' tasks. Later ones appear as the weeks go by.`,
} as const;
