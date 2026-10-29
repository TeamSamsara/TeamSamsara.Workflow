// File : /TeamSamsara.Workflow/app/src/core/session/returnPath.test.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Tests that only pages inside the app are remembered for after sign-in.

import { describe, expect, it } from "vitest";
import { readReturnPath, returnPathState } from "./returnPath";

describe("return path", () => {
  it("remembers the page and its query", () => {
    expect(readReturnPath(returnPathState("/tasks/42", "?tab=x"))).toBe(
      "/tasks/42?tab=x",
    );
  });

  it("refuses addresses outside the app", () => {
    expect(readReturnPath({ from: "https://evil.example" })).toBeNull();
    expect(readReturnPath({ from: "//evil.example" })).toBeNull();
  });

  it("gives null when nothing was remembered", () => {
    expect(readReturnPath(null)).toBeNull();
    expect(readReturnPath({})).toBeNull();
    expect(readReturnPath("/tasks")).toBeNull();
  });
});
