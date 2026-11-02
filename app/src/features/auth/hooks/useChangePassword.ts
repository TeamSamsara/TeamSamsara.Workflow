// File : /TeamSamsara.Workflow/app/src/features/auth/hooks/useChangePassword.ts
// Version : 1.0.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : Changes the signed-in person's password (after checking their
// current one), and emails them a link to choose a new one when they've
// forgotten it.

import { useMutation } from "@tanstack/react-query";
import {
  AuthErrorText,
  authErrorKind,
  changePassword,
  sendPasswordLink,
} from "@/core/session";

interface ChangeRequest {
  current: string;
  password: string;
}

export function useChangePassword(onDone: () => void) {
  const change = useMutation({
    mutationFn: ({ current, password }: ChangeRequest) =>
      changePassword(current, password),
    onSuccess: onDone,
  });
  const reset = useMutation({
    mutationFn: (email: string) => sendPasswordLink(email),
  });

  return {
    submit: change.mutate,
    isSaving: change.isPending,
    errorMessage: change.error
      ? AuthErrorText[authErrorKind(change.error)]
      : null,
    sendReset: reset.mutate,
    isSendingReset: reset.isPending,
    resetSent: reset.isSuccess,
    resetError: reset.error ? AuthErrorText[authErrorKind(reset.error)] : null,
  };
}
