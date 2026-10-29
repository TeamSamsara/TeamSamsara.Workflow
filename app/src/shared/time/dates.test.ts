// File : /TeamSamsara.Workflow/app/src/shared/time/dates.test.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Tests how dates are written: in the given time zone, with Today
// and Yesterday, and the year only when it isn't this year.

import { describe, expect, it } from "vitest";
import {
  dayKey,
  formatLongDate,
  formatRecentDay,
  formatShortDate,
} from "./dates";

const toronto = "America/Toronto";
const now = new Date("2026-12-17T15:00:00Z"); // 10:00 in Toronto

describe("dayKey", () => {
  it("uses the time zone's calendar day", () => {
    // 02:00 UTC on the 17th is still the 16th in Toronto.
    expect(dayKey(new Date("2026-12-17T02:00:00Z"), toronto)).toBe(
      "2026-12-16",
    );
    expect(dayKey(new Date("2026-12-17T02:00:00Z"), "UTC")).toBe("2026-12-17");
  });
});

describe("formatting", () => {
  it("writes long and short dates", () => {
    expect(formatLongDate(new Date("2026-10-03T16:00:00Z"), toronto)).toBe(
      "Oct 3, 2026",
    );
    expect(
      formatShortDate(new Date("2026-12-10T16:00:00Z"), toronto, now),
    ).toBe("Dec 10");
    expect(
      formatShortDate(new Date("2025-12-10T16:00:00Z"), toronto, now),
    ).toBe("Dec 10, 2025");
  });

  it("says Today, Yesterday or Never for recent activity", () => {
    expect(
      formatRecentDay(new Date("2026-12-17T12:00:00Z"), toronto, now),
    ).toBe("Today");
    expect(
      formatRecentDay(new Date("2026-12-17T02:00:00Z"), toronto, now),
    ).toBe("Yesterday");
    expect(
      formatRecentDay(new Date("2026-12-12T16:00:00Z"), toronto, now),
    ).toBe("Dec 12");
    expect(formatRecentDay(null, toronto, now)).toBe("Never");
  });
});
