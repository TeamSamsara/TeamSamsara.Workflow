// File : /TeamSamsara.Workflow/app/src/features/members/hooks/useInviteMembers.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Runs an invite for the invite dialog, keeping each email's result
// as it comes in so the dialog can show progress and what went wrong.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "@/core/session";
import { inviteMembers } from "../service/inviteService";
import type { InviteChoice, InviteResult } from "../types/memberTypes";
import { useMembers } from "./useMembers";

export function useInviteMembers() {
  const session = useSession();
  const members = useMembers();
  const [results, setResults] = useState<InviteResult[]>([]);

  const mutation = useMutation({
    mutationFn: ({
      emails,
      choice,
    }: {
      emails: string[];
      choice: InviteChoice;
    }) => {
      if (session.status !== "active") throw new Error("Not signed in");
      setResults([]);
      return inviteMembers(
        emails,
        choice,
        session.user.id,
        members.records,
        (result) => setResults((previous) => [...previous, result]),
      );
    },
  });

  return {
    invite: mutation.mutate,
    isSending: mutation.isPending,
    isDone: mutation.isSuccess,
    results,
    isReady: members.status === "ready",
  };
}
