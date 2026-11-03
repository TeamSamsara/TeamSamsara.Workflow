// File : /TeamSamsara.Workflow/app/src/features/events/model/weekLayout.test.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Tests where items sit in a day of the week view.

import { describe, expect, it } from "vitest";
import { layoutDay } from "./weekLayout";

const at = (hour: number, minute = 0) => hour * 60 + minute;

describe("week layout", () => {
  it("puts an item at its time, from 8 AM", () => {
    const { placed } = layoutDay([
      { item: "practice", start: at(19), end: at(22) },
    ]);
    expect(placed[0]).toMatchObject({
      top: at(11),
      height: at(3),
      column: 0,
      columns: 1,
    });
  });

  it("puts overlapping items side by side, and the next ones back to full width", () => {
    const { placed } = layoutDay([
      { item: "a", start: at(10), end: at(12) },
      { item: "b", start: at(11), end: at(13) },
      { item: "c", start: at(11, 30), end: at(12, 30) },
      { item: "d", start: at(14), end: at(15) },
    ]);
    const byItem = Object.fromEntries(
      placed.map((entry) => [entry.item, entry]),
    );
    expect(byItem.a).toMatchObject({ column: 0, columns: 3 });
    expect(byItem.b).toMatchObject({ column: 1, columns: 3 });
    expect(byItem.c).toMatchObject({ column: 2, columns: 3 });
    expect(byItem.d).toMatchObject({ column: 0, columns: 1 });
  });

  it("reuses a column once its item is over", () => {
    const { placed } = layoutDay([
      { item: "a", start: at(10), end: at(11) },
      { item: "b", start: at(10, 30), end: at(12) },
      { item: "c", start: at(11), end: at(11, 30) },
    ]);
    expect(placed.find((entry) => entry.item === "c")).toMatchObject({
      column: 0,
      columns: 2,
    });
  });

  it("cuts items at the edges and keeps early ones as markers", () => {
    const { placed, early } = layoutDay([
      { item: "breakfast", start: at(6), end: at(7) },
      { item: "bootcamp", start: at(7), end: at(9) },
      { item: "late", start: at(23), end: at(25) },
    ]);
    expect(early).toEqual(["breakfast"]);
    expect(placed.find((entry) => entry.item === "bootcamp")).toMatchObject({
      top: 0,
      height: 60,
      cutTop: true,
    });
    expect(placed.find((entry) => entry.item === "late")).toMatchObject({
      top: at(15),
      height: 60,
      cutBottom: true,
    });
  });

  it("draws short items at least half an hour tall", () => {
    const { placed } = layoutDay([{ item: "due", start: at(12), end: at(12) }]);
    expect(placed[0].height).toBe(30);
  });
});
