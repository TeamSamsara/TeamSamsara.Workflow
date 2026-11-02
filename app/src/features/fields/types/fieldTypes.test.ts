// File : /TeamSamsara.Workflow/app/src/features/fields/types/fieldTypes.test.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : Tests field keys and how values read in text.

import { describe, expect, it } from "vitest";
import { fieldText } from "../model/fieldText";
import { fieldKeyPattern, keyFromName, nameFromKey } from "./fieldTypes";

describe("keyFromName", () => {
  it("makes a key text can write", () => {
    expect(keyFromName("Co-streamer")).toBe("co_streamer");
    expect(keyFromName("  Match link ")).toBe("match_link");
    expect(keyFromName("Équipe adverse")).toBe("equipe_adverse");
    expect(keyFromName("1st map")).toBe("f_1st_map");
    expect(fieldKeyPattern.test(keyFromName("A".repeat(60)))).toBe(true);
  });

  it("names a key back", () => {
    expect(nameFromKey("co_streamer")).toBe("Co streamer");
  });
});

describe("fieldText", () => {
  const options = { dateFormat: "weekdayMonthDay", clock: "24h" } as const;

  it("reads a date and time in the formats", () => {
    expect(fieldText({ type: "datetime" }, "2026-11-14T19:00", options)).toBe(
      "Sat, Nov 14, 19:00",
    );
  });

  it("reads a person by name, or keeps the id if unknown", () => {
    const names = {
      ...options,
      memberName: (id: string) => (id === "sam" ? "Rivi" : null),
    };
    expect(fieldText({ type: "person" }, "sam", names)).toBe("Rivi");
    expect(fieldText({ type: "person" }, "gone", names)).toBe("gone");
  });

  it("keeps anything else as typed", () => {
    expect(fieldText({ type: "text" }, " Kitsune ", options)).toBe("Kitsune");
    expect(fieldText(undefined, "x", options)).toBe("x");
  });
});
