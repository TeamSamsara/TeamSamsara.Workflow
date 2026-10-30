// File : /TeamSamsara.Workflow/app/src/features/workflows/model/dueOffsetContent.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : How a due time reads: "At the start", "1 hour before",
// "2 days before, 7:00 PM", "Next day, 9:00 AM".

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export const DueOffsetText = {
  atStart: "At the start",
  days: (count: number) => plural(count, "day", "days"),
  hours: (count: number) => plural(count, "hour", "hours"),
  minutes: (count: number) => plural(count, "minute", "minutes"),
  before: (amount: string) => `${amount} before`,
  after: (amount: string) => `${amount} after`,
  sameDay: (time: string) => `Same day, ${time}`,
  dayBefore: (time: string) => `Day before, ${time}`,
  nextDay: (time: string) => `Next day, ${time}`,
  daysBefore: (days: number, time: string) =>
    `${plural(days, "day", "days")} before, ${time}`,
  daysAfter: (days: number, time: string) =>
    `${plural(days, "day", "days")} after, ${time}`,
} as const;
