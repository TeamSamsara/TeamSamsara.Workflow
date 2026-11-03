// File : /TeamSamsara.Workflow/app/src/features/events/model/repeatContent.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : A repeat in words: "Every Mon and Thu at 7:00 PM, until Dec 31.
// Skipping Dec 24."

export const RepeatSummaryText = {
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  every: (days: string, time: string) => `Every ${days} at ${time}`,
  everyDay: (time: string) => `Every day at ${time}`,
  until: (date: string) => `until ${date}`,
  times: (count: number) => (count === 1 ? "once" : `${count} times`),
  skipping: (dates: string) => `Skipping ${dates}.`,
  and: " and ",
} as const;
