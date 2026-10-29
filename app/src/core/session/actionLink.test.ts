// File : /TeamSamsara.Workflow/app/src/core/session/actionLink.test.ts
// Version : 1.1.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Tests reading the mode, code and purpose from a Firebase email link.

import { describe, expect, it } from "vitest";
import { readActionLink } from "./actionLink";

const invite = encodeURIComponent("https://workflow.example/sign-in?invite=1");
const reset = encodeURIComponent("https://workflow.example/sign-in");

describe("readActionLink", () => {
  it("reads a reset link", () => {
    expect(
      readActionLink(
        `?mode=resetPassword&oobCode=abc123&apiKey=key&continueUrl=${reset}`,
      ),
    ).toEqual({ mode: "resetPassword", code: "abc123", purpose: "reset" });
  });

  it("recognises an invite by the marker in its continue address", () => {
    expect(
      readActionLink(`?mode=resetPassword&oobCode=abc&continueUrl=${invite}`)
        ?.purpose,
    ).toBe("invite");
  });

  it("treats a missing or broken continue address as a reset", () => {
    expect(readActionLink("?mode=resetPassword&oobCode=abc")?.purpose).toBe(
      "reset",
    );
    expect(
      readActionLink("?mode=resetPassword&oobCode=abc&continueUrl=not-a-url")
        ?.purpose,
    ).toBe("reset");
  });

  it("ignores links for things the app does not handle", () => {
    expect(readActionLink("?mode=verifyEmail&oobCode=abc")).toBeNull();
  });

  it("ignores a link with no code", () => {
    expect(readActionLink("?mode=resetPassword")).toBeNull();
    expect(readActionLink("")).toBeNull();
  });
});
