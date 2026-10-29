// File : /TeamSamsara.Workflow/app/src/core/session/actionLink.test.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Tests reading the mode and code from a Firebase email link.

import { describe, expect, it } from "vitest";
import { readActionLink } from "./actionLink";

describe("readActionLink", () => {
  it("reads a password link", () => {
    expect(
      readActionLink("?mode=resetPassword&oobCode=abc123&apiKey=key&lang=en"),
    ).toEqual({ mode: "resetPassword", code: "abc123" });
  });

  it("ignores links for things the app does not handle", () => {
    expect(readActionLink("?mode=verifyEmail&oobCode=abc")).toBeNull();
  });

  it("ignores a link with no code", () => {
    expect(readActionLink("?mode=resetPassword")).toBeNull();
    expect(readActionLink("")).toBeNull();
  });
});
