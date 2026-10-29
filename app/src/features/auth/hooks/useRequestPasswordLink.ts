// File : /TeamSamsara.Workflow/app/src/features/auth/hooks/useRequestPasswordLink.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Asks for a password link to be emailed. An email with no account is
// treated as sent, so the page never reveals which emails have one.

import { useMutation } from "@tanstack/react-query";
import { AuthErrorText, authErrorKind, sendPasswordLink } from "@/core/session";

async function requestLink(email: string): Promise<void> {
  try {
    await sendPasswordLink(email);
  } catch (error) {
    if (authErrorKind(error) === "wrongCredentials") return;
    throw error;
  }
}

export function useRequestPasswordLink(onSent?: (email: string) => void) {
  const mutation = useMutation({
    mutationFn: requestLink,
    onSuccess: (_result, email) => onSent?.(email),
  });

  return {
    request: mutation.mutate,
    isSending: mutation.isPending,
    errorMessage: mutation.error
      ? AuthErrorText[authErrorKind(mutation.error)]
      : null,
  };
}
