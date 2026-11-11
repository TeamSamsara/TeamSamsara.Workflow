// File : /TeamSamsara.Workflow/app/src/features/availability/model/hourGrid.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests the hour grid: who's free each hour, people who haven't
// filled in left out of the counts, cell shades, free stretches and the
// times everyone shown is free.

import { describe, expect, it } from "vitest";
import { weekOf } from "@/shared/time/weekGrid";
import type { AvailabilityRecord } from "../types/availabilityTypes";
import {
  cellTone,
  everyoneFree,
  freeStretches,
  hourRows,
  type GridPerson,
} from "./hourGrid";

const toronto = "America/Toronto";
// Monday 9 November 2026.
const week = weekOf(
  "2026-11-09",
  "monday",
  toronto,
  new Date("2026-11-01T12:00:00Z"),
);

/** Busy every day but from `from` to midnight. */
const freeFrom = (from: number): AvailabilityRecord => ({
  memberId: "x",
  weekly: Object.fromEntries(
    Array.from({ length: 7 }, (_, day) => [
      day,
      Array.from({ length: from }, (_, hour) => hour),
    ]),
  ),
  exceptions: [],
  timeZone: toronto,
  updatedAt: null,
});

const person = (id: string, from: number | null): GridPerson => ({
  id,
  time: { availability: from === null ? null : freeFrom(from), busy: [] },
  filled: from !== null,
});

const people = [
  person("okami", 17),
  person("salty", 19),
  person("fliptik", null),
];

describe("hourRows", () => {
  const rows = hourRows(week.days, people, toronto);

  it("has an hour per row from 8 AM to midnight and a cell per day", () => {
    expect(rows).toHaveLength(16);
    expect(rows[0]).toHaveLength(7);
  });

  it("counts only people who filled in", () => {
    // 6 PM on Monday: Okami free, Salty not yet.
    const six = rows[10][0];
    expect(six.free).toEqual(["okami"]);
    expect(six.busy).toEqual(["salty"]);
    expect(cellTone(six)).toBe("some");
    // 8 PM: both free.
    expect(cellTone(rows[12][0])).toBe("all");
    // 9 AM: nobody.
    expect(cellTone(rows[1][0])).toBe("none");
  });

  it("finds two hours or more when everyone shown is free", () => {
    const found = everyoneFree(rows, new Date("2026-11-01T00:00:00Z"));
    expect(found).toHaveLength(7);
    // Monday 7 PM to midnight in Toronto.
    expect(found[0].start.toISOString()).toBe("2026-11-10T00:00:00.000Z");
    expect(found[0].end.toISOString()).toBe("2026-11-10T05:00:00.000Z");
  });

  it("leaves out times already past", () => {
    const found = everyoneFree(rows, new Date("2026-11-12T12:00:00Z"));
    expect(found).toHaveLength(4);
  });
});

describe("freeStretches", () => {
  it("is each free stretch of the day's shown hours", () => {
    const [stretch] = freeStretches(people[0].time, week.days[0], toronto);
    expect(stretch.start.toISOString()).toBe("2026-11-09T22:00:00.000Z");
    expect(stretch.end.toISOString()).toBe("2026-11-10T05:00:00.000Z");
  });
});
