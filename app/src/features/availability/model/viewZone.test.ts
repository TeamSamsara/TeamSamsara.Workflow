// File : /TeamSamsara.Workflow/app/src/features/availability/model/viewZone.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests picking the zone Team availability shows and how far apart two zones are.

import { describe, expect, it } from "vitest";
import { hoursApart, zoneFor } from "./viewZone";

describe("zoneFor", () => {
  it("is the team's unless Mine is picked and the viewer has a zone", () => {
    expect(zoneFor("team", "America/Toronto", "America/Vancouver")).toBe(
      "America/Toronto",
    );
    expect(zoneFor("mine", "America/Toronto", "America/Vancouver")).toBe(
      "America/Vancouver",
    );
    expect(zoneFor("mine", "America/Toronto", null)).toBe("America/Toronto");
  });
});

describe("hoursApart", () => {
  it("says how far ahead or behind a zone is", () => {
    const at = new Date("2026-11-11T12:00:00Z");
    expect(hoursApart("America/Los_Angeles", "America/Toronto", at)).toBe(-3);
    expect(hoursApart("Europe/Paris", "America/Toronto", at)).toBe(6);
    expect(hoursApart("Asia/Kolkata", "America/Toronto", at)).toBe(10.5);
  });
});
