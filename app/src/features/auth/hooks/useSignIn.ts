// File : /TeamSamsara.Workflow/app/src/features/auth/hooks/useSignIn.ts
// Version : 1.1.0
// Latest commit: feature/remember-me
// Author : Gerrah
// Purpose : Sends the sign-in, with busy and error states. On success nothing
// else is needed: the session changes and the sign-in page sends the person on.

import { useMutation } from "@tanstack/react-query";
import { AuthErrorText, authErrorKind, signIn } from "@/core/session";
import type { SignInValues } from "../validation/authValidation";

export function useSignIn() {
  const mutation = useMutation({
    mutationFn: ({ email, password, keep }: SignInValues) =>
      signIn(email, password, keep),
  });

  return {
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    errorMessage: mutation.error
      ? AuthErrorText[authErrorKind(mutation.error)]
      : null,
  };
}
