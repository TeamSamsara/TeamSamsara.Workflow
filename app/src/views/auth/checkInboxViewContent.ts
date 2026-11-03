// File : /TeamSamsara.Workflow/app/src/views/auth/checkInboxViewContent.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The text of the check-your-inbox page.

export const CheckInboxViewText = {
  title: "Check your inbox",
  sentTo: (email: string) =>
    `If ${email} has an account, a reset link is on its way. It works for 1 hour.`,
  sentGeneric:
    "If that email has an account, a reset link is on its way. It works for 1 hour.",
  tipSpam: "Look in spam or promotions if it isn't there in a minute.",
  tipLink: "The link opens this site so you can pick a new password.",
  backToSignIn: "Back to sign in",
  resend: "Resend",
  resendIn: (time: string) => `Resend in ${time}`,
  resent: "Sent again",
} as const;
