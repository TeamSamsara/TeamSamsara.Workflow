// File : /TeamSamsara.Workflow/app/src/features/availability/model/freeBusy.ts
// Version : 1.2.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Who's free when. Checks a person against their usual week, their
// exceptions and their personal appointments, half an hour at a time in the
// workspace's time zone; draws a day as free / unavailable / busy stretches;
// and finds times when everyone in a list is free.

import { FreeStep, isAvailableAt as engineIsAvailableAt } from "@engine/free";
import type { AvailabilityRecord } from "../types/availabilityTypes";

/** A busy stretch: a personal appointment, with its title when it can be seen. */
export interface BusyBlock {
  startsAt: Date;
  endsAt: Date;
  title?: string;
}

export interface PersonTime {
  availability: AvailabilityRecord | null;
  busy: readonly BusyBlock[];
}

export type SlotState = "free" | "unavailable" | "busy";

const step = FreeStep;

/**
 * Whether the usual week and the exceptions leave this moment free. They're
 * read in the zone the member painted them in, else the one given. Shared
 * with the server, which checks the same when it hands out tasks.
 */
export const isAvailableAt: (
  availability: AvailabilityRecord | null,
  instant: Date,
  timeZone: string,
) => boolean = engineIsAvailableAt;

/** What a person is doing in one half-hour from this moment. */
export function slotState(
  person: PersonTime,
  instant: Date,
  timeZone: string,
): { state: SlotState; title?: string } {
  const end = instant.getTime() + step;
  const busy = person.busy.find(
    (block) =>
      block.startsAt.getTime() < end &&
      block.endsAt.getTime() > instant.getTime(),
  );
  if (busy) return { state: "busy", title: busy.title };
  return {
    state: isAvailableAt(person.availability, instant, timeZone)
      ? "free"
      : "unavailable",
  };
}

/** Whether a person can make it from start to end; when not, why. */
export function checkPerson(
  person: PersonTime,
  start: Date,
  end: Date,
  timeZone: string,
): { state: SlotState; title?: string } {
  let unavailable = false;
  for (let at = start.getTime(); at < end.getTime(); at += step) {
    const slot = slotState(person, new Date(at), timeZone);
    if (slot.state === "busy") return slot;
    if (slot.state === "unavailable") unavailable = true;
  }
  return { state: unavailable ? "unavailable" : "free" };
}

export interface Stretch {
  state: SlotState;
  start: Date;
  end: Date;
  title?: string;
}

/** A person's day between two moments, as free / unavailable / busy stretches. */
export function stretches(
  person: PersonTime,
  from: Date,
  to: Date,
  timeZone: string,
): Stretch[] {
  const list: Stretch[] = [];
  for (let at = from.getTime(); at < to.getTime(); at += step) {
    const slot = slotState(person, new Date(at), timeZone);
    const last = list[list.length - 1];
    if (last && last.state === slot.state && last.title === slot.title)
      last.end = new Date(at + step);
    else list.push({ ...slot, start: new Date(at), end: new Date(at + step) });
  }
  return list;
}

/**
 * Times when everyone is free for this long, one per day: the free time
 * closest to the time asked for. Days are given as their
 * first moment shown (8 AM) and last (midnight); past times are left out.
 */
export function freeTimes(
  people: readonly PersonTime[],
  minutes: number,
  days: readonly { from: Date; to: Date; preferred: Date }[],
  timeZone: string,
  now: Date,
  limit = 3,
): Date[] {
  const length = minutes * 60_000;
  const allFree = (start: Date) =>
    people.every(
      (person) =>
        checkPerson(person, start, new Date(start.getTime() + length), timeZone)
          .state === "free",
    );
  const found: Date[] = [];
  for (const day of days) {
    if (found.length >= limit) break;
    // The closest to the time asked for wins; on a tie, the earlier one.
    const candidates: Date[] = [];
    for (
      let at = day.from.getTime();
      at + length <= day.to.getTime();
      at += step
    )
      candidates.push(new Date(at));
    if (!candidates.some((time) => time.getTime() === day.preferred.getTime()))
      candidates.push(day.preferred);
    const distance = (time: Date) =>
      Math.abs(time.getTime() - day.preferred.getTime());
    candidates.sort(
      (a, b) => distance(a) - distance(b) || a.getTime() - b.getTime(),
    );
    const pick = candidates.find(
      (start) =>
        start >= now &&
        start >= day.from &&
        start.getTime() + length <= day.to.getTime() &&
        allFree(start),
    );
    if (pick) found.push(pick);
  }
  return found;
}
