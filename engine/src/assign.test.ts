// File : /TeamSamsara.Workflow/engine/src/assign.test.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests handing out a group's tasks: free for an hour in the 6
// hours before it's due, the daily limit (not counting tasks a step named
// them for), least busy over the next 7 days, the same-event
// tie-break, people who don't take tasks, how far ahead it looks, the
// heads-up, and reading the group's settings safely.

// describe, it and expect come from Vitest's globals (see app/vitest.config.ts).
import {
  AssignLimits,
  handOut,
  isFreeBefore,
  needsHeadsUp,
  pickAssignee,
  readAssign,
  type AssignSettings,
  type Candidate,
  type QueuedTask,
} from "./assign.js";
import { hasFreeStretch, isAvailableAt } from "./free.js";

const timeZone = "UTC";
const at = (text: string) => new Date(`${text}Z`);
// Saturday, Nov 14 2026; "now" is that morning.
const now = at("2026-11-14T08:00:00");
const settings: AssignSettings = {
  on: true,
  dailyLimit: 3,
  headsUpHours: 24,
  skip: [],
};
const context = { settings, now, timeZone };

const person = (id: string, change: Partial<Candidate> = {}): Candidate => ({
  id,
  week: null,
  busy: [],
  tasks: [],
  ...change,
});
const task = (
  id: string,
  due: string | null,
  eventId: string | null = "e1",
): QueuedTask => ({
  id,
  eventId,
  dueAt: due ? at(due) : null,
});
const held = (id: string, due: string, eventId: string | null = null) => ({
  id,
  eventId,
  dueAt: at(due),
});

describe("free time", () => {
  it("reads the usual week, then the dates that differ", () => {
    // Saturday (6) unavailable from 18:00 to 19:59.
    const week = {
      weekly: { 6: [18, 19] },
      exceptions: [
        { date: "2026-11-14", from: "19:00", to: "20:00", available: true },
      ],
      timeZone: null,
    };
    expect(isAvailableAt(week, at("2026-11-14T18:30:00"), timeZone)).toBe(
      false,
    );
    expect(isAvailableAt(week, at("2026-11-14T19:30:00"), timeZone)).toBe(true);
    expect(isAvailableAt(null, at("2026-11-14T18:30:00"), timeZone)).toBe(true);
  });

  it("needs an unbroken stretch", () => {
    const busy = [
      {
        startsAt: at("2026-11-14T12:30:00"),
        endsAt: at("2026-11-14T13:00:00"),
      },
    ];
    // 12:00-12:30 free, 12:30-13:00 busy, 13:00-13:30 free: no full hour.
    expect(
      hasFreeStretch(
        null,
        busy,
        at("2026-11-14T12:00:00"),
        at("2026-11-14T13:30:00"),
        60,
        timeZone,
      ),
    ).toBe(false);
    expect(
      hasFreeStretch(
        null,
        busy,
        at("2026-11-14T12:00:00"),
        at("2026-11-14T14:00:00"),
        60,
        timeZone,
      ),
    ).toBe(true);
  });
});

describe("free before it's due", () => {
  // Due at 20:00: the window is 14:00 to 20:00.
  const due = at("2026-11-14T20:00:00");

  it("counts an hour anywhere in the 6 hours before", () => {
    const week = {
      weekly: { 6: [14, 15, 16, 17, 18] },
      exceptions: [],
      timeZone: null,
    };
    expect(isFreeBefore(person("a", { week }), due, context)).toBe(true);
  });

  it("isn't free when the whole window is taken", () => {
    const week = {
      weekly: { 6: [14, 15, 16, 17, 18, 19] },
      exceptions: [],
      timeZone: null,
    };
    expect(isFreeBefore(person("a", { week }), due, context)).toBe(false);
  });

  it("only counts time still to come", () => {
    const late = { ...context, now: at("2026-11-14T19:15:00") };
    expect(isFreeBefore(person("a"), due, late)).toBe(false);
  });
});

describe("who gets a task", () => {
  const due = "2026-11-14T20:00:00";

  it("is the least busy over the next 7 days", () => {
    const busy = person("a", {
      tasks: [
        held("x", "2026-11-15T10:00:00"),
        held("y", "2026-11-16T10:00:00"),
      ],
    });
    // Two tasks, but one is weeks away.
    const quiet = person("b", {
      tasks: [
        held("z", "2026-11-14T10:00:00"),
        held("w", "2026-12-20T10:00:00"),
      ],
    });
    expect(pickAssignee(task("t", due), [busy, quiet], context)).toBe("b");
  });

  it("doesn't count tasks a step named them for against the limit", () => {
    const named = person("a", {
      tasks: ["1", "2", "3"].map((id) => ({
        ...held(id, "2026-11-14T09:00:00"),
        byName: true,
      })),
    });
    expect(pickAssignee(task("t", due), [named], context)).toBe("a");
  });

  it("on a tie, already has a task on that event", () => {
    const other = person("a", {
      tasks: [held("x", "2026-11-15T10:00:00", "e2")],
    });
    const same = person("b", {
      tasks: [held("y", "2026-11-15T10:00:00", "e1")],
    });
    expect(pickAssignee(task("t", due), [other, same], context)).toBe("b");
  });

  it("never someone at their daily limit", () => {
    const full = person("a", {
      tasks: ["1", "2", "3"].map((id) => held(id, "2026-11-14T09:00:00")),
    });
    expect(pickAssignee(task("t", due), [full], context)).toBeNull();
  });

  it("never someone who doesn't take tasks", () => {
    const lead = person("lead");
    const skip = { ...context, settings: { ...settings, skip: ["lead"] } };
    expect(pickAssignee(task("t", due), [lead], skip)).toBeNull();
  });

  it("waits for tasks too far ahead, and leaves past ones", () => {
    expect(
      pickAssignee(task("t", "2026-12-20T20:00:00"), [person("a")], context),
    ).toBeNull();
    expect(
      pickAssignee(task("t", "2026-11-13T20:00:00"), [person("a")], context),
    ).toBeNull();
  });

  it("gives a task with no due time to whoever has the fewest", () => {
    const some = person("a", { tasks: [held("x", "2026-11-20T10:00:00")] });
    expect(pickAssignee(task("t", null), [some, person("b")], context)).toBe(
      "b",
    );
  });
});

describe("handing out a queue", () => {
  it("does nothing while the group's switch is off", () => {
    const off = { ...context, settings: { ...settings, on: false } };
    expect(
      handOut([task("t", "2026-11-14T20:00:00")], [person("a")], off),
    ).toEqual([]);
  });

  it("counts each task given against the limit, earliest first", () => {
    const queue = ["4", "1", "3", "2"].map((n) =>
      task(`t${n}`, `2026-11-14T1${n}:00:00`),
    );
    const given = handOut(queue, [person("a")], {
      ...context,
      settings: { ...settings, dailyLimit: AssignLimits.dailyLimit.min },
    });
    expect(given).toEqual([
      { taskId: "t1", memberId: "a" },
      { taskId: "t2", memberId: "a" },
    ]);
  });

  it("spreads tasks across the group", () => {
    const queue = [
      task("t1", "2026-11-14T20:00:00"),
      task("t2", "2026-11-14T21:00:00"),
    ];
    const given = handOut(queue, [person("a"), person("b")], context);
    expect(new Set(given.map((entry) => entry.memberId))).toEqual(
      new Set(["a", "b"]),
    );
  });
});

describe("the heads-up", () => {
  it("comes once a waiting task is within the group's notice", () => {
    expect(needsHeadsUp(task("t", "2026-11-15T07:00:00"), settings, now)).toBe(
      true,
    );
    expect(needsHeadsUp(task("t", "2026-11-15T09:00:00"), settings, now)).toBe(
      false,
    );
    expect(needsHeadsUp(task("t", "2026-11-14T07:00:00"), settings, now)).toBe(
      false,
    );
  });
});

describe("the group's settings", () => {
  it("take the defaults and stay in bounds", () => {
    expect(readAssign(undefined)).toEqual({
      on: false,
      dailyLimit: 3,
      headsUpHours: 24,
      skip: [],
    });
    expect(
      readAssign({ on: true, dailyLimit: 40, headsUpHours: 5, skip: ["a", 2] }),
    ).toEqual({
      on: true,
      dailyLimit: 10,
      headsUpHours: 24,
      skip: ["a"],
    });
    expect(readAssign({ dailyLimit: 1, headsUpHours: 48 }).dailyLimit).toBe(2);
  });
});
