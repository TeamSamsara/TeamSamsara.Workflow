// File : /TeamSamsara.Workflow/app/src/core/data/timestamps.test.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Tests turning Firestore timestamps into dates and back.

import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { fromDate, toDate } from "./timestamps";

const when = new Date("2026-12-14T19:00:00.123Z");

describe("timestamps", () => {
  it("turn a Timestamp into the same moment", () => {
    expect(toDate(Timestamp.fromDate(when))).toEqual(when);
  });

  it("accept anything shaped like a timestamp", () => {
    const { seconds, nanoseconds } = Timestamp.fromDate(when);
    expect(toDate({ seconds, nanoseconds })).toEqual(when);
  });

  it("give null for anything else", () => {
    expect(toDate(undefined)).toBeNull();
    expect(toDate("2026-12-14")).toBeNull();
    expect(toDate({ seconds: "1" })).toBeNull();
  });

  it("round-trip a date", () => {
    expect(toDate(fromDate(when))).toEqual(when);
    expect(fromDate(null)).toBeNull();
  });
});
