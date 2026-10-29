// File : /TeamSamsara.Workflow/app/src/views/auth/emailLinkViewContent.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The text of the page every Firebase email link opens: an invite's
// welcome, or a reset's new password.

export const EmailLinkViewText = {
  checking: "Checking your link",
  inviteTitle: "Welcome! Set your password",
  inviteDescription:
    "This is the last step. After this you sign in with your email and this password.",
  resetTitle: "Choose a new password",
  resetDescription: (email: string) =>
    `Pick a new password for ${email}. You'll be signed in straight after.`,
  errorTitle: "Can't check this link",
  tryAgain: "Try again",
} as const;
