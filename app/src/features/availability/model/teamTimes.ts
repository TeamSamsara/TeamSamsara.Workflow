// File : /TeamSamsara.Workflow/app/src/features/availability/model/teamTimes.ts
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : A team's week: each day's shown hours (8 AM to midnight), and the
// stretches of at least two hours when everyone in it is free.

import type { WeekDay } from "@/shared/time/weekGrid";
import { stretches, type PersonTime } from "./freeBusy";

export const dayFrom = (day: WeekDay) =>
  new Date(day.start.getTime() + 8 * 3_600_000);
export const dayTo = (day: WeekDay) => day.end;

/** The stretches of at least two hours when everyone is free, across the week. */
export function bestTimes(
  days: readonly WeekDay[],
  people: readonly { id: string }[],
  timeFor: (memberId: string) => PersonTime,
  timeZone: string,
  now: Date,
): { start: Date; end: Date }[] {
  const found: { start: Date; end: Date }[] = [];
  for (const day of days) {
    let open: { start: Date; end: Date } | null = null;
    for (
      let at = dayFrom(day).getTime();
      at <= dayTo(day).getTime();
      at += 30 * 60_000
    ) {
      const slot = new Date(at);
      const everyone =
        at < dayTo(day).getTime() &&
        slot >= now &&
        people.every((person) => {
          const parts = stretches(
            timeFor(person.id),
            slot,
            new Date(at + 30 * 60_000),
            timeZone,
          );
          return parts.every((part) => part.state === "free");
        });
      if (everyone) {
        const slotEnd = new Date(at + 30 * 60_000);
        open =
          open === null
            ? { start: slot, end: slotEnd }
            : { start: open.start, end: slotEnd };
      } else if (open) {
        if (open.end.getTime() - open.start.getTime() >= 2 * 3_600_000)
          found.push(open);
        open = null;
      }
    }
  }
  return found;
}
