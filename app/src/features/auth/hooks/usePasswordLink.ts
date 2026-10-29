// File : /TeamSamsara.Workflow/app/src/features/auth/hooks/usePasswordLink.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Reads the password link a page was opened with and checks its code
// with Firebase once: still good (with the email it was sent to), expired or
// already used, or impossible to check right now.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AuthErrorText,
  authErrorKind,
  checkPasswordLink,
  readActionLink,
  type ActionLink,
} from "@/core/session";

const queryKeyRoot = "passwordLink";

export type PasswordLinkCheck =
  | { status: "checking" }
  | { status: "valid"; link: ActionLink; email: string }
  | { status: "expired" }
  | { status: "error"; message: string; retry: () => void };

export function usePasswordLink(search: string): PasswordLinkCheck {
  const link = useMemo(() => readActionLink(search), [search]);

  const check = useQuery({
    queryKey: [queryKeyRoot, link?.code],
    queryFn: () => checkPasswordLink(link?.code ?? ""),
    enabled: link !== null,
    // A code works once: never check it again after the first answer.
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!link) return { status: "expired" };
  if (check.isPending) return { status: "checking" };
  if (check.isError) {
    const kind = authErrorKind(check.error);
    if (kind === "linkExpired" || kind === "linkInvalid") {
      return { status: "expired" };
    }
    return {
      status: "error",
      message: AuthErrorText[kind],
      retry: () => void check.refetch(),
    };
  }
  return { status: "valid", link, email: check.data };
}
