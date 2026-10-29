// File : /TeamSamsara.Workflow/app/src/shared/validation/validationContent.ts
// Version : 1.2.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The words for the shared checks: field errors and the password rules.

export const ValidationText = {
  nameRequired: "Enter a name.",
  nameTooLong: (characters: number) =>
    `Keep it to ${characters} characters or fewer.`,
  linkLabelRequired: "Give the link a name.",
  linkInvalid: "Enter a web address starting with https://",
  emailRequired: "Enter your email.",
  emailInvalid: "That doesn't look like an email address.",
  passwordRequired: "Enter your password.",
  passwordTooWeak: "Your password doesn't meet the rules below.",
  passwordsDontMatch: "The two passwords don't match.",
} as const;

export const PasswordRuleText = {
  minimumLength: (characters: number) => `At least ${characters} characters`,
  numberOrSymbol: "One number or symbol",
  matches: "Both passwords match",
} as const;
