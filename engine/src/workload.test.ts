// File : /TeamSamsara.Workflow/engine/src/workload.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : Tests how full a week is: task sizes, the week a moment is in,
// the load of a week and the word it reads as.

// describe, it and expect come from Vitest's globals (see app/vitest.config.ts).
import {
  hasRoom,
  readUsualWeek,
  taskSize,
  weekLoad,
  weekOf,
  weekState,
} from "./workload.js";

const quick = { checklist: null, posts: null, needsApproval: false };
const bigger = { checklist: [1, 2, 3], posts: null, needsApproval: false };

describe("taskSize", () => {
  it("makes a task bigger for a long checklist, several platforms or an approval", () => {
    expect(taskSize(quick)).toBe("quick");
    expect(taskSize({ ...quick, checklist: [1, 2] })).toBe("quick");
    expect(taskSize(bigger)).toBe("bigger");
    expect(taskSize({ ...quick, posts: [1, 2] })).toBe("bigger");
    expect(taskSize({ ...quick, needsApproval: true })).toBe("bigger");
  });
});

describe("weekOf", () => {
  it("runs from the first day of the week, in the time zone", () => {
    // Wed Nov 18, 2026, 11:00 PM in Toronto (Thursday in UTC).
    const week = weekOf(
      new Date("2026-11-19T04:00:00Z"),
      "America/Toronto",
      "monday",
    );
    expect(week.start.toISOString()).toBe("2026-11-16T05:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-11-23T05:00:00.000Z");
    const sunday = weekOf(
      new Date("2026-11-19T04:00:00Z"),
      "America/Toronto",
      "sunday",
    );
    expect(sunday.start.toISOString()).toBe("2026-11-15T05:00:00.000Z");
  });
});

describe("weekLoad and weekState", () => {
  const week = weekOf(
    new Date("2026-11-18T17:00:00Z"),
    "America/Toronto",
    "monday",
  );
  const at = (iso: string) => new Date(iso);

  it("counts the tasks due that week, bigger ones twice", () => {
    expect(
      weekLoad(
        [
          { ...quick, dueAt: at("2026-11-17T17:00:00Z") },
          { ...bigger, dueAt: at("2026-11-20T17:00:00Z") },
          { ...quick, dueAt: at("2026-11-24T17:00:00Z") },
          { ...quick, dueAt: null },
        ],
        week,
      ),
    ).toBe(3);
  });

  it("reads the week as one word, and says what still fits", () => {
    expect(weekState(3, 0)).toBe("available");
    expect(weekState(3, 2)).toBe("limited");
    expect(weekState(3, 3)).toBe("atCapacity");
    expect(weekState(3, 5)).toBe("over");
    expect(hasRoom(3, 2, "quick")).toBe(true);
    expect(hasRoom(3, 2, "bigger")).toBe(false);
  });

  it("reads a stored usual week safely", () => {
    expect(readUsualWeek(4.4)).toBe(4);
    expect(readUsualWeek(99)).toBe(40);
    expect(readUsualWeek("3")).toBeNull();
  });
});
