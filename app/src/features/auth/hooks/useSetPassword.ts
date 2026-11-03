// File : /TeamSamsara.Workflow/app/src/features/auth/hooks/useSetPassword.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Saves the password chosen from an email link, then signs the person
// in with it. Tells the page when the link turned out to be expired.

import { useMutation } from "@tanstack/react-query";
import {
  AuthErrorText,
  authErrorKind,
  setPasswordFromLink,
} from "@/core/session";

interface SetPasswordRequest {
  code: string;
  email: string;
  password: string;
}

interface SetPasswordCallbacks {
  onDone: () => void;
  onExpired: () => void;
}

export function useSetPassword({ onDone, onExpired }: SetPasswordCallbacks) {
  const mutation = useMutation({
    mutationFn: ({ code, email, password }: SetPasswordRequest) =>
      setPasswordFromLink(code, email, password),
    onSuccess: onDone,
    onError: (error) => {
      const kind = authErrorKind(error);
      if (kind === "linkExpired" || kind === "linkInvalid") onExpired();
    },
  });

  return {
    submit: mutation.mutate,
    isSaving: mutation.isPending,
    errorMessage: mutation.error
      ? AuthErrorText[authErrorKind(mutation.error)]
      : null,
  };
}
