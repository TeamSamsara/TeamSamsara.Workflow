// File : /TeamSamsara.Workflow/app/src/features/availability/model/freeBusy.test.ts
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : Tests who's free when: the usual week, exceptions that override
// it, personal appointments, a day in stretches, and finding free times.

import { describe, expect, it } from "vitest";
import type { AvailabilityRecord } from "../types/availabilityTypes";
import { checkPerson, freeTimes, isAvailableAt, stretches } from "./freeBusy";

const tz = "UTC";
const at = (text: string) => new Date(`${text}:00Z`);

/** School on weekday mornings (8 AM to 3 PM). Nov 2 2026 is a Monday. */
const kai: AvailabilityRecord = {
  memberId: "kai",
  weekly: { 1: [8, 9, 10, 11, 12, 13, 14], 2: [8, 9, 10, 11, 12, 13, 14] },
  exceptions: [
    { date: "2026-11-03", from: null, to: null, available: true },
    { date: "2026-11-04", from: "18:00", to: "20:00", available: false },
  ],
  updatedAt: null,
};

describe("availability", () => {
  it("follows the usual week", () => {
    expect(isAvailableAt(kai, at("2026-11-02T09:00"), tz)).toBe(false);
    expect(isAvailableAt(kai, at("2026-11-02T15:00"), tz)).toBe(true);
    expect(isAvailableAt(null, at("2026-11-02T09:00"), tz)).toBe(true);
  });

  it("lets exceptions override it", () => {
    expect(isAvailableAt(kai, at("2026-11-03T09:00"), tz)).toBe(true);
    expect(isAvailableAt(kai, at("2026-11-04T18:30"), tz)).toBe(false);
    expect(isAvailableAt(kai, at("2026-11-04T20:00"), tz)).toBe(true);
  });

  it("says why someone can't make it, appointments first", () => {
    const person = {
      availability: kai,
      busy: [
        {
          startsAt: at("2026-11-02T14:00"),
          endsAt: at("2026-11-02T15:00"),
          title: "Dentist",
        },
      ],
    };
    expect(
      checkPerson(person, at("2026-11-02T13:00"), at("2026-11-02T16:00"), tz),
    ).toEqual({ state: "busy", title: "Dentist" });
    expect(
      checkPerson(person, at("2026-11-02T12:00"), at("2026-11-02T13:30"), tz),
    ).toEqual({ state: "unavailable" });
    expect(
      checkPerson(person, at("2026-11-02T19:00"), at("2026-11-02T22:00"), tz),
    ).toEqual({ state: "free" });
  });

  it("draws a day as stretches", () => {
    const day = stretches(
      { availability: kai, busy: [] },
      at("2026-11-02T08:00"),
      at("2026-11-02T18:00"),
      tz,
    );
    expect(
      day.map((part) => [
        part.state,
        part.start.getUTCHours(),
        part.end.getUTCHours(),
      ]),
    ).toEqual([
      ["unavailable", 8, 15],
      ["free", 15, 18],
    ]);
  });

  it("finds times when everyone is free, as close to the time asked as it can", () => {
    const people = [
      { availability: kai, busy: [] },
      {
        availability: null,
        busy: [
          { startsAt: at("2026-11-03T20:00"), endsAt: at("2026-11-03T21:00") },
        ],
      },
    ];
    const day = (date: string) => ({
      from: at(`${date}T08:00`),
      to: at(`${date}T23:59`),
      preferred: at(`${date}T19:00`),
    });
    const times = freeTimes(
      people,
      120,
      [day("2026-11-03"), day("2026-11-04"), day("2026-11-05")],
      tz,
      at("2026-11-01T00:00"),
    );
    expect(times.map((time) => time.toISOString().slice(5, 16))).toEqual([
      "11-03T18:00",
      "11-04T20:00",
      "11-05T19:00",
    ]);
  });
});
