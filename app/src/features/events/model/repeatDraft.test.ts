// File : /TeamSamsara.Workflow/app/src/features/events/model/repeatDraft.test.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : Tests the repeat form: it starts on the first date's weekday, says
// what's missing, and turns into a schedule.

import { describe, expect, it } from "vitest";
import {
  checkRepeatDraft,
  scheduleFromDraft,
  startRepeatDraft,
} from "./repeatDraft";

describe("repeat form", () => {
  it("starts on the first date's weekday, with no end", () => {
    expect(startRepeatDraft("2026-11-02")).toMatchObject({
      weekdays: [1],
      endKind: "never",
    });
    expect(startRepeatDraft("").weekdays).toEqual([]);
  });

  it("says what's missing", () => {
    const draft = startRepeatDraft("2026-11-02");
    expect(checkRepeatDraft(draft, "2026-11-02").count).toBe(0);
    expect(
      checkRepeatDraft({ ...draft, weekdays: [] }, "2026-11-02").weekdays,
    ).toBeTruthy();
    expect(
      checkRepeatDraft({ ...draft, endKind: "onDate" }, "2026-11-02").endDate,
    ).toBeTruthy();
    expect(
      checkRepeatDraft(
        { ...draft, endKind: "onDate", endDate: "2026-10-01" },
        "2026-11-02",
      ).endDate,
    ).toBeTruthy();
    expect(
      checkRepeatDraft(
        { ...draft, endKind: "afterCount", endCount: "0" },
        "2026-11-02",
      ).endCount,
    ).toBeTruthy();
    expect(
      checkRepeatDraft(
        { ...draft, endKind: "afterCount", endCount: "201" },
        "2026-11-02",
      ).endCount,
    ).toBeTruthy();
    expect(
      checkRepeatDraft(
        { ...draft, endKind: "afterCount", endCount: "10" },
        "2026-11-02",
      ).count,
    ).toBe(0);
  });

  it("keeps only the end that's picked", () => {
    const draft = {
      ...startRepeatDraft("2026-11-02"),
      weekdays: [4, 1, 1],
      endDate: "2026-12-31",
      endCount: "8",
    };
    expect(
      scheduleFromDraft(
        { ...draft, endKind: "afterCount" },
        "2026-11-02",
        "10:00",
      ),
    ).toMatchObject({
      weekdays: [1, 4],
      endDate: null,
      endCount: 8,
      startDate: "2026-11-02",
      time: "10:00",
    });
    expect(
      scheduleFromDraft({ ...draft, endKind: "onDate" }, "2026-11-02", "10:00"),
    ).toMatchObject({
      endDate: "2026-12-31",
      endCount: null,
    });
  });
});
