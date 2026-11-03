// File : /TeamSamsara.Workflow/app/src/core/session/authErrors.test.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Tests sorting Firebase sign-in errors into the reasons people see.

import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";
import { authErrorKind } from "./authErrors";

const error = (code: string) => new FirebaseError(code, "");

describe("authErrorKind", () => {
  it("never tells wrong email from wrong password", () => {
    expect(authErrorKind(error("auth/user-not-found"))).toBe(
      "wrongCredentials",
    );
    expect(authErrorKind(error("auth/wrong-password"))).toBe(
      "wrongCredentials",
    );
    expect(authErrorKind(error("auth/invalid-credential"))).toBe(
      "wrongCredentials",
    );
  });

  it("sorts link, rate and network errors", () => {
    expect(authErrorKind(error("auth/expired-action-code"))).toBe(
      "linkExpired",
    );
    expect(authErrorKind(error("auth/invalid-action-code"))).toBe(
      "linkInvalid",
    );
    expect(authErrorKind(error("auth/too-many-requests"))).toBe(
      "tooManyAttempts",
    );
    expect(authErrorKind(error("auth/network-request-failed"))).toBe("offline");
  });

  it("calls anything else unknown", () => {
    expect(authErrorKind(error("auth/internal-error"))).toBe("unknown");
    expect(authErrorKind(new Error("boom"))).toBe("unknown");
  });
});
