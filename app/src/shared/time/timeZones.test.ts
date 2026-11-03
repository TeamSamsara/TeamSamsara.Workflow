// File : /TeamSamsara.Workflow/app/src/shared/time/timeZones.test.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Tests the time zone labels, offsets (with daylight saving) and the
// order of the picker's options.

import { describe, expect, it } from "vitest";
import {
  availableTimeZones,
  formatUtcOffset,
  isTimeZone,
  timeZoneLabel,
  timeZoneOptions,
  universalTimeZone,
  utcOffsetMinutes,
} from "./timeZones";

const winter = new Date("2026-01-15T12:00:00Z");
const summer = new Date("2026-07-15T12:00:00Z");

describe("utcOffsetMinutes", () => {
  it("follows daylight saving", () => {
    expect(utcOffsetMinutes("America/Toronto", winter)).toBe(-300);
    expect(utcOffsetMinutes("America/Toronto", summer)).toBe(-240);
  });

  it("handles half-hour zones and UTC", () => {
    expect(utcOffsetMinutes("Asia/Kolkata", winter)).toBe(330);
    expect(utcOffsetMinutes(universalTimeZone, winter)).toBe(0);
  });
});

describe("formatUtcOffset", () => {
  it("writes whole hours, minutes and a real minus sign", () => {
    expect(formatUtcOffset(0)).toBe("UTC");
    expect(formatUtcOffset(60)).toBe("UTC+1");
    expect(formatUtcOffset(-300)).toBe("UTC−5");
    expect(formatUtcOffset(330)).toBe("UTC+5:30");
    expect(formatUtcOffset(-570)).toBe("UTC−9:30");
  });
});

describe("timeZoneLabel", () => {
  it("reads like the design", () => {
    expect(timeZoneLabel("America/Toronto", winter)).toBe(
      "America/Toronto (UTC−5)",
    );
    expect(timeZoneLabel("America/New_York", winter)).toBe(
      "America/New York (UTC−5)",
    );
  });
});

describe("the zone list", () => {
  it("always includes UTC", () => {
    expect(availableTimeZones()).toContain(universalTimeZone);
  });

  it("goes west to east", () => {
    const options = timeZoneOptions(winter);
    const offsets = options.map((option) =>
      utcOffsetMinutes(option.value, winter),
    );
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(
      options.find((option) => option.value === "Europe/Paris")?.label,
    ).toBe("Europe/Paris (UTC+1)");
  });

  it("recognises real zones only", () => {
    expect(isTimeZone("Europe/Paris")).toBe(true);
    expect(isTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});
