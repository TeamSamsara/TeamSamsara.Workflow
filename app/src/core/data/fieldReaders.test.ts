// File : /TeamSamsara.Workflow/app/src/core/data/fieldReaders.test.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Tests that each field reader returns the value when it is the right
// kind, and the fallback when it is missing or wrong.

import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
  readBoolean,
  readChoice,
  readDate,
  readMap,
  readNumber,
  readOptionalString,
  readString,
  readStringList,
} from "./fieldReaders";

const colours = ["red", "green"] as const;

describe("field readers", () => {
  it("read strings, with a fallback", () => {
    expect(readString({ name: "Ana" }, "name")).toBe("Ana");
    expect(readString({ name: 4 }, "name", "none")).toBe("none");
    expect(readString({}, "name")).toBe("");
  });

  it("read optional strings as null when empty or missing", () => {
    expect(readOptionalString({ zone: "UTC" }, "zone")).toBe("UTC");
    expect(readOptionalString({ zone: "" }, "zone")).toBeNull();
    expect(readOptionalString({}, "zone")).toBeNull();
  });

  it("read finite numbers only", () => {
    expect(readNumber({ n: 3 }, "n")).toBe(3);
    expect(readNumber({ n: Number.NaN }, "n", 7)).toBe(7);
    expect(readNumber({ n: "3" }, "n")).toBe(0);
  });

  it("read booleans only", () => {
    expect(readBoolean({ on: true }, "on")).toBe(true);
    expect(readBoolean({ on: "yes" }, "on")).toBe(false);
  });

  it("read string lists, dropping anything that is not a string", () => {
    expect(readStringList({ ids: ["a", 2, "b", null] }, "ids")).toEqual([
      "a",
      "b",
    ]);
    expect(readStringList({ ids: "a" }, "ids")).toEqual([]);
  });

  it("read a choice from a fixed set", () => {
    expect(readChoice({ c: "green" }, "c", colours, "red")).toBe("green");
    expect(readChoice({ c: "blue" }, "c", colours, "red")).toBe("red");
  });

  it("read timestamps as dates", () => {
    const when = new Date("2026-12-14T19:00:00Z");
    expect(readDate({ at: Timestamp.fromDate(when) }, "at")).toEqual(when);
    expect(readDate({ at: "yesterday" }, "at")).toBeNull();
  });

  it("read maps, but not lists or null", () => {
    expect(readMap({ m: { a: 1 } }, "m")).toEqual({ a: 1 });
    expect(readMap({ m: [1] }, "m")).toEqual({});
    expect(readMap({ m: null }, "m")).toEqual({});
  });
});
