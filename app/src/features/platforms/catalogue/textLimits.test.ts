// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/textLimits.test.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Tests counting characters as people see them (emoji, accents,
// line breaks), checking a text against a limit, and counting hashtags.

import { describe, expect, it } from "vitest";
import { checkText, countCharacters, countHashtags } from "./textLimits";

describe("countCharacters", () => {
  it("counts an emoji as one, even when it is several code points", () => {
    expect(countCharacters("👍")).toBe(1);
    expect(countCharacters("👨‍👩‍👧‍👦")).toBe(1);
    expect(countCharacters("🇨🇦 go")).toBe(4);
  });

  it("counts an accented letter as one, written either way", () => {
    expect(countCharacters("é")).toBe(1);
    expect(countCharacters("é")).toBe(1);
  });

  it("counts a line break as one, Windows-style too", () => {
    expect(countCharacters("a\nb")).toBe(3);
    expect(countCharacters("a\r\nb")).toBe(3);
  });
});

describe("checkText", () => {
  const limit = { field: "post" as const, maxCharacters: 5 };

  it("says how much room is left", () => {
    expect(checkText("hey", limit)).toEqual({
      count: 3,
      max: 5,
      remaining: 2,
      isOver: false,
    });
    expect(checkText("hello", limit).isOver).toBe(false);
  });

  it("flags a text that is over", () => {
    expect(checkText("hello!", limit)).toEqual({
      count: 6,
      max: 5,
      remaining: -1,
      isOver: true,
    });
  });
});

describe("countHashtags", () => {
  it("finds hashtags, not # inside words", () => {
    expect(countHashtags("#live tonight #gaming! issue#3 #été")).toBe(3);
    expect(countHashtags("no tags")).toBe(0);
  });
});
