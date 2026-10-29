// File : /TeamSamsara.Workflow/app/src/shared/components/Avatar/avatarInitials.test.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Tests the two letters an avatar shows when there is no photo.

import { describe, expect, it } from "vitest";
import { avatarInitials } from "./avatarInitials";

describe("avatarInitials", () => {
  it("takes the first letters of the first and last words", () => {
    expect(avatarInitials("Sam Rivera")).toBe("SR");
    expect(avatarInitials("Mary Jane Watson")).toBe("MW");
  });

  it("takes the first two letters of a single word", () => {
    expect(avatarInitials("Priya")).toBe("PR");
  });

  it("ignores extra spaces and capitalises", () => {
    expect(avatarInitials("  jordan   lee ")).toBe("JL");
  });

  it("returns nothing for an empty name", () => {
    expect(avatarInitials("")).toBe("");
    expect(avatarInitials("   ")).toBe("");
  });
});
