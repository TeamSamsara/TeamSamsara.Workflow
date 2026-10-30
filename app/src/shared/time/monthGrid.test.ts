// File : /TeamSamsara.Workflow/app/src/shared/time/monthGrid.test.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : Tests the month view's weeks with Monday and Sunday starts, and
// the moments it covers in Toronto.

import { describe, expect, it } from "vitest";
import { addMonths, monthGrid, parseMonthKey } from "./monthGrid";

const toronto = "America/Toronto";

describe("monthGrid", () => {
  it("fills whole weeks from Monday", () => {
    // November 2026 starts on a Sunday.
    const grid = monthGrid(
      2026,
      11,
      "monday",
      toronto,
      new Date("2026-11-04T19:00:00Z"),
    );
    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks[0][0].key).toBe("2026-10-26");
    expect(grid.weeks[0][6]).toMatchObject({
      key: "2026-11-01",
      inMonth: true,
    });
    expect(grid.weeks[5][6].key).toBe("2026-12-06");
    expect(
      grid.weeks
        .flat()
        .filter((day) => day.isToday)
        .map((day) => day.key),
    ).toEqual(["2026-11-04"]);
    expect(grid.start).toEqual(new Date("2026-10-26T04:00:00Z"));
    expect(grid.end).toEqual(new Date("2026-12-07T05:00:00Z"));
  });

  it("fills whole weeks from Sunday", () => {
    const grid = monthGrid(2026, 11, "sunday", toronto);
    expect(grid.weeks).toHaveLength(5);
    expect(grid.weeks[0][0].key).toBe("2026-11-01");
    expect(grid.weeks[4][6].key).toBe("2026-12-05");
  });
});

describe("month keys", () => {
  it("parse and step across years", () => {
    expect(parseMonthKey("2026-11")).toEqual({ year: 2026, month: 11 });
    expect(parseMonthKey("2026-13")).toBeNull();
    expect(parseMonthKey(null)).toBeNull();
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});
