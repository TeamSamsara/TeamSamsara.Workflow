// File : /TeamSamsara.Workflow/app/src/features/events/model/lateTasks.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests finding the tasks that are already late when an event is
// planned: only those due before now, across every event, earliest first.

import { describe, expect, it } from "vitest";
import { newStep, type WorkflowRecord } from "@/features/workflows";
import { findLateTasks, isLateAtCreation } from "./lateTasks";

const formats = {
  timeZone: "America/Toronto",
  clock: "12h",
  dateFormat: "weekdayMonthDay",
} as const;

const workflow: WorkflowRecord = {
  id: "promo",
  name: "Match day",
  description: "",
  eventTypeId: null,
  archived: false,
  createdAt: null,
  updatedAt: null,
  steps: [
    {
      ...newStep(),
      id: "graphic",
      title: "Prep match graphic",
      due: {
        direction: "before",
        days: 2,
        hours: 0,
        minutes: 0,
        time: "23:30",
      },
    },
    {
      ...newStep(),
      id: "discord",
      title: "Prep Discord post",
      due: {
        direction: "before",
        days: 1,
        hours: 0,
        minutes: 0,
        time: "18:00",
      },
    },
    {
      ...newStep(),
      id: "recap",
      title: "Post the result",
      due: { direction: "after", days: 0, hours: 2, minutes: 0, time: null },
    },
  ],
};

// Thursday Nov 5, 2026 at 7:00 PM in Toronto.
const now = new Date("2026-11-06T00:00:00Z");

const event = (title: string, startsAt: string) => ({
  title,
  startsAt: new Date(startsAt),
  link: null,
  details: {},
});

describe("findLateTasks", () => {
  it("finds the tasks already due when a Friday match is planned on Thursday night", () => {
    const late = findLateTasks(
      [event("vs. Kitsune", "2026-11-07T01:00:00Z")],
      [workflow],
      formats,
      now,
    );
    expect(late.map((task) => task.title)).toEqual([
      "Prep match graphic",
      "Prep Discord post",
    ]);
    expect(late[0].eventTitle).toBe("vs. Kitsune");
  });

  it("finds none for an event far enough ahead", () => {
    expect(
      findLateTasks(
        [event("vs. Orca", "2026-11-20T22:00:00Z")],
        [workflow],
        formats,
        now,
      ),
    ).toEqual([]);
  });

  it("looks across every event, earliest due first", () => {
    const late = findLateTasks(
      [
        event("vs. Orca", "2026-11-20T22:00:00Z"),
        event("vs. Kitsune", "2026-11-07T01:00:00Z"),
      ],
      [workflow],
      formats,
      now,
    );
    expect(late).toHaveLength(2);
    expect(late.every((task) => task.eventTitle === "vs. Kitsune")).toBe(true);
  });
});

describe("isLateAtCreation", () => {
  it("is true only before now", () => {
    expect(isLateAtCreation(new Date(now.getTime() - 1), now)).toBe(true);
    expect(isLateAtCreation(now, now)).toBe(false);
    expect(isLateAtCreation(null, now)).toBe(false);
  });
});
