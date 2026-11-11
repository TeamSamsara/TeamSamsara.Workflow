// File : /TeamSamsara.Workflow/app/src/features/availability/hooks/useWhoCanMake.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Who can make each of several planned events: how many of the
// people in them are free, and who isn't (busy with a personal appointment or
// usually unavailable then). With required people, only they count; the
// optional ones being away doesn't matter. Reads everyone's busy times once.

import { useAllAvailability, useBusyInRange } from "./useAvailability";
import { checkPerson } from "../model/freeBusy";

export interface Span {
  key: string;
  start: Date;
  end: Date;
}

export interface WhoCanMake {
  free: number;
  total: number;
  /** The names of who can't, in the order given. */
  away: string[];
}

const day = 86_400_000;

export function useWhoCanMake(
  people: readonly { id: string; name: string }[],
  spans: readonly Span[],
  timeZone: string,
  /** When some are required, only they count. */
  requiredIds: readonly string[] = [],
): Map<string, WhoCanMake> {
  const counted = requiredIds.length
    ? people.filter((person) => requiredIds.includes(person.id))
    : people;
  const availability = useAllAvailability();
  const times = spans.flatMap((span) => [
    span.start.getTime(),
    span.end.getTime(),
  ]);
  // Whole days around the events, so editing a time doesn't ask again.
  const from = new Date(
    Math.floor((times.length ? Math.min(...times) : 0) / day) * day - day,
  );
  const to = new Date(
    Math.ceil((times.length ? Math.max(...times) : 0) / day) * day + day,
  );
  const busy = useBusyInRange(from, to, people.length > 0 && spans.length > 0);
  const checks = new Map<string, WhoCanMake>();
  for (const span of spans) {
    const away = counted.filter((person) => {
      const state = checkPerson(
        {
          availability: availability.get(person.id) ?? null,
          busy: busy.filter((entry) => entry.memberId === person.id),
        },
        span.start,
        span.end,
        timeZone,
      ).state;
      return state !== "free";
    });
    checks.set(span.key, {
      free: counted.length - away.length,
      total: counted.length,
      away: away.map((person) => person.name),
    });
  }
  return checks;
}
