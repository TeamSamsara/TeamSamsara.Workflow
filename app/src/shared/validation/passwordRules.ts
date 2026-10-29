// File : /TeamSamsara.Workflow/app/src/shared/validation/passwordRules.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The rules a new password must meet, and which ones a value meets, so
// a form can tick them off as the person types.

export const minimumPasswordLength = 8;

export type PasswordRule = "minimumLength" | "numberOrSymbol";

export interface PasswordRuleResult {
  rule: PasswordRule;
  met: boolean;
}

const numberOrSymbol = /[^A-Za-z]/;

export function checkPasswordRules(value: string): PasswordRuleResult[] {
  return [
    { rule: "minimumLength", met: value.length >= minimumPasswordLength },
    { rule: "numberOrSymbol", met: numberOrSymbol.test(value) },
  ];
}

export function meetsPasswordRules(value: string): boolean {
  return checkPasswordRules(value).every((result) => result.met);
}
