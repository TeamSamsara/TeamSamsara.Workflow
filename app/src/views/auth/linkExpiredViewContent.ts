// File : /TeamSamsara.Workflow/app/src/views/auth/linkExpiredViewContent.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The text of the link-expired page.

export const LinkExpiredViewText = {
  title: "This link has expired",
  body: "Links are good for 1 hour and work only once. This one is too old or was already used.",
  inviteQuestion: "Were you setting your password for the first time?",
  inviteAnswer:
    "Ask the person who invited you to press Resend invite. You'll get a fresh link.",
  resetQuestion: "Already have a password?",
  resetAnswer: "Request a new reset link.",
  newLink: "Get a new reset link",
  backToSignIn: "Back to sign in",
} as const;
