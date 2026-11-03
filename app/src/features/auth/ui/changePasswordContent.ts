// File : /TeamSamsara.Workflow/app/src/features/auth/ui/changePasswordContent.ts
// Version : 1.0.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : The words of the change-password form on Your account.

export const ChangePasswordText = {
  current: "Current password",
  currentRequired: "Enter your current password.",
  newPassword: "New password",
  confirmation: "New password again",
  submit: "Change password",
  forgot: "Forgot your current one?",
  sendReset: "Email me a reset link",
  resetSent: (email: string) =>
    `Sent. Check ${email} for a link to choose a new password.`,
} as const;
