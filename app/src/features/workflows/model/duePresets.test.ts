// File : /TeamSamsara.Workflow/app/src/features/workflows/model/duePresets.test.ts
// Version : 1.0.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : Tests the due time presets and the custom amount conversion.

import { describe, expect, it } from "vitest";
import { atTheStart, type DueOffset } from "../types/workflowTypes";
import { fromAmount, halfHours, matchPreset, toAmount } from "./duePresets";

const due = (changes: Partial<DueOffset>): DueOffset => ({
  direction: "before",
  days: 0,
  hours: 0,
  minutes: 0,
  time: null,
  ...changes,
});

describe("matchPreset", () => {
  it("finds the preset a due time is", () => {
    expect(matchPreset(atTheStart)?.id).toBe("start");
    expect(matchPreset(due({ hours: 1 }))?.id).toBe("1h-before");
    expect(matchPreset(due({ days: 1 }))?.id).toBe("1d-before");
    expect(matchPreset(due({ days: 1, time: "19:00" }))?.id).toBe("1d-before");
    expect(matchPreset(due({ direction: "after", days: 1 }))?.id).toBe(
      "1d-after",
    );
  });

  it("finds none for other due times", () => {
    expect(matchPreset(due({ hours: 2 }))).toBeNull();
    expect(matchPreset(due({ days: 1, hours: 2 }))).toBeNull();
    expect(matchPreset(due({ days: 3 }))).toBeNull();
  });
});

describe("amounts", () => {
  it("read a due time as one amount", () => {
    expect(toAmount(due({ days: 2 }))).toEqual({ amount: 2, unit: "days" });
    expect(toAmount(due({ days: 2, time: "19:00" }))).toEqual({
      amount: 2,
      unit: "days",
    });
    expect(toAmount(due({ days: 1, hours: 12 }))).toEqual({
      amount: 36,
      unit: "hours",
    });
    expect(toAmount(due({ hours: 1, minutes: 30 }))).toEqual({
      amount: 90,
      unit: "minutes",
    });
  });

  it("go back to a due time", () => {
    expect(fromAmount({ amount: 36, unit: "hours" }, "before", null)).toEqual(
      due({ days: 1, hours: 12 }),
    );
    expect(fromAmount({ amount: 90, unit: "minutes" }, "after", null)).toEqual(
      due({ direction: "after", hours: 1, minutes: 30 }),
    );
    expect(fromAmount({ amount: 2, unit: "days" }, "before", "19:00")).toEqual(
      due({ days: 2, time: "19:00" }),
    );
    // A time of day only goes with whole days.
    expect(
      fromAmount({ amount: 3, unit: "hours" }, "before", "19:00").time,
    ).toBeNull();
    expect(fromAmount({ amount: -4, unit: "days" }, "before", null).days).toBe(
      0,
    );
    expect(fromAmount({ amount: 999, unit: "days" }, "before", null).days).toBe(
      60,
    );
  });
});

describe("halfHours", () => {
  it("lists every half hour of the day", () => {
    const times = halfHours();
    expect(times).toHaveLength(48);
    expect(times[0]).toBe("00:00");
    expect(times[39]).toBe("19:30");
  });
});
