// File : /TeamSamsara.Workflow/app/src/shared/time/dates.test.ts
// Version : 1.1.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Tests how dates are written: in the given time zone, with Today
// and Yesterday, and the year only when it isn't this year.

import { describe, expect, it } from "vitest";
import {
  dayKey,
  formatDate,
  formatTime,
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

describe("workspace formats", () => {
  const evening = new Date("2026-12-15T00:00:00Z"); // 19:00 on Dec 14 in Toronto

  it("writes the date every way a workspace can pick", () => {
    expect(formatDate(evening, toronto, "weekdayMonthDay")).toBe("Mon, Dec 14");
    expect(formatDate(evening, toronto, "monthDay")).toBe("Dec 14");
    expect(formatDate(evening, toronto, "dayMonth")).toBe("14 Dec");
    expect(formatDate(evening, toronto, "isoDate")).toBe("2026-12-14");
  });

  it("writes the time on a 12- or 24-hour clock", () => {
    expect(formatTime(evening, toronto, "12h")).toBe("7:00 PM");
    expect(formatTime(evening, toronto, "24h")).toBe("19:00");
  });
});
