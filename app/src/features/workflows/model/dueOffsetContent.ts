// File : /TeamSamsara.Workflow/app/src/features/workflows/model/dueOffsetContent.ts
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : How a due time reads, in everyday words: "When the event starts",
// "1 hour before", "The day before at 7:00 PM", "A week before".

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export const DueOffsetText = {
  atStart: "When the event starts",
  days: (count: number) => plural(count, "day", "days"),
  hours: (count: number) => plural(count, "hour", "hours"),
  minutes: (count: number) => plural(count, "minute", "minutes"),
  before: (amount: string) => `${amount} before`,
  after: (amount: string) => `${amount} after`,
  /** Whole days, said the friendly way when there's a name for it. */
  dayAmount: (days: number, direction: "before" | "after") => {
    if (days === 1)
      return direction === "before" ? "The day before" : "The day after";
    if (days === 7)
      return direction === "before" ? "A week before" : "A week after";
    return `${plural(days, "day", "days")} ${direction}`;
  },
  sameDay: "The same day",
  atTime: (day: string, time: string) => `${day} at ${time}`,
} as const;
