// File : /TeamSamsara.Workflow/app/src/features/auth/validation/authValidation.test.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Tests the checks the sign-in forms run before sending.

import { describe, expect, it } from "vitest";
import { ValidationText } from "@/shared/validation/validationContent";
import {
  checkEmail,
  checkNewPassword,
  checkSignIn,
  hasFieldErrors,
} from "./authValidation";

describe("checkEmail", () => {
  it("asks for an email when empty", () => {
    expect(checkEmail("  ")).toBe(ValidationText.emailRequired);
  });

  it("catches a typo", () => {
    expect(checkEmail("sam@example")).toBe(ValidationText.emailInvalid);
  });

  it("accepts an address", () => {
    expect(checkEmail("sam@example.com")).toBeUndefined();
  });
});

describe("checkSignIn", () => {
  it("needs both fields", () => {
    const errors = checkSignIn({ email: "", password: "" });
    expect(errors.email).toBe(ValidationText.emailRequired);
    expect(errors.password).toBe(ValidationText.passwordRequired);
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it("passes with an email and any password", () => {
    expect(
      hasFieldErrors(checkSignIn({ email: "sam@example.com", password: "x" })),
    ).toBe(false);
  });
});

describe("checkNewPassword", () => {
  it("needs a password that meets the rules", () => {
    expect(
      checkNewPassword({ password: "short", confirmation: "short" }).password,
    ).toBe(ValidationText.passwordTooWeak);
  });

  it("needs the two passwords to match", () => {
    expect(
      checkNewPassword({ password: "Workflow-1", confirmation: "Workflow-2" })
        .confirmation,
    ).toBe(ValidationText.passwordsDontMatch);
  });

  it("passes a good, matching password", () => {
    expect(
      hasFieldErrors(
        checkNewPassword({
          password: "Workflow-1",
          confirmation: "Workflow-1",
        }),
      ),
    ).toBe(false);
  });
});
