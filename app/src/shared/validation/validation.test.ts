// File : /TeamSamsara.Workflow/app/src/shared/validation/validation.test.ts
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Tests the email check, the password rules and the name check.

import { describe, expect, it } from "vitest";
import { isEmailAddress } from "./emailFormat";
import { checkName } from "./nameRules";
import { checkPasswordRules, meetsPasswordRules } from "./passwordRules";
import { TextLimits } from "./textLimits";
import { ValidationText } from "./validationContent";

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

describe("checkName", () => {
  it("accepts a name, ignoring surrounding spaces", () => {
    expect(checkName("  Team Samsara ")).toBeUndefined();
    expect(checkName("x".repeat(TextLimits.name))).toBeUndefined();
  });

  it("rejects a blank or too-long name", () => {
    expect(checkName("   ")).toBe(ValidationText.nameRequired);
    expect(checkName("x".repeat(TextLimits.name + 1))).toBe(
      ValidationText.nameTooLong(TextLimits.name),
    );
  });
});
