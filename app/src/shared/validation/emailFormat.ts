// File : /TeamSamsara.Workflow/app/src/shared/validation/emailFormat.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : A quick check that text looks like an email address, to catch typos
// before a form is sent. The server decides whether the address is real.

// Something@something.something, with no spaces.
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailAddress(value: string): boolean {
  return emailShape.test(value.trim());
}
