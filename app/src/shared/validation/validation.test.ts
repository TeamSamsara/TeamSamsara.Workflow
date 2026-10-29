// File : /TeamSamsara.Workflow/app/src/shared/validation/validation.test.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Tests the email check and the password rules.

import { describe, expect, it } from "vitest";
import { isEmailAddress } from "./emailFormat";
import { checkPasswordRules, meetsPasswordRules } from "./passwordRules";

describe("isEmailAddress", () => {
  it("accepts ordinary addresses, ignoring surrounding spaces", () => {
    expect(isEmailAddress("sam@example.com")).toBe(true);
    expect(isEmailAddress("  sam.rivera+work@team.example.co  ")).toBe(true);
  });

  it("rejects text that is not an address", () => {
    expect(isEmailAddress("")).toBe(false);
    expect(isEmailAddress("sam")).toBe(false);
    expect(isEmailAddress("sam@example")).toBe(false);
    expect(isEmailAddress("sam @example.com")).toBe(false);
  });
});

describe("password rules", () => {
  it("ticks off each rule separately", () => {
    expect(checkPasswordRules("short1")).toEqual([
      { rule: "minimumLength", met: false },
      { rule: "numberOrSymbol", met: true },
    ]);
    expect(checkPasswordRules("longenough")).toEqual([
      { rule: "minimumLength", met: true },
      { rule: "numberOrSymbol", met: false },
    ]);
  });

  it("passes when every rule is met", () => {
    expect(meetsPasswordRules("longenough!")).toBe(true);
    expect(meetsPasswordRules("Workflow-dev-1")).toBe(true);
    expect(meetsPasswordRules("password")).toBe(false);
  });
});
