// File : /TeamSamsara.Workflow/app/src/features/members/hooks/useMemberActions.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The access actions on a member's page (resend invite, turn access
// off or on, remove), each with a toast when it's done or fails. Confirming
// first is the page's job.

import { useMutation } from "@tanstack/react-query";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { useToast } from "@/shared/components/Toast/useToast";
import { sendInviteEmail } from "../service/inviteService";
import {
  removeMember,
  turnOffAccess,
  turnOnAccess,
} from "../service/memberService";
import { memberName } from "../types/memberTypes";
import { MemberActionText } from "../ui/membersContent";

export function useMemberActions(member: MemberRecord) {
  const toast = useToast();
  const name = memberName(member);

  const onError = (error: unknown) =>
    toast.show({
      tone: "error",
      title: MemberActionText.failed,
      detail: dataErrorMessage(error),
    });
  const done = (title: string) => () => toast.show({ tone: "success", title });

  const resend = useMutation({
    mutationFn: () => sendInviteEmail(member.email),
    onSuccess: done(MemberActionText.resent(member.email)),
    onError,
  });
  const turnOff = useMutation({
    mutationFn: () => turnOffAccess(member.id),
    onSuccess: done(MemberActionText.turnedOff(name)),
    onError,
  });
  const turnOn = useMutation({
    mutationFn: () => turnOnAccess(member),
    onSuccess: done(MemberActionText.turnedOn(name)),
    onError,
  });
  const remove = useMutation({
    mutationFn: () => removeMember(member.id),
    onSuccess: done(MemberActionText.removed(name)),
    onError,
  });

  return {
    resend,
    turnOff,
    turnOn,
    remove,
    isBusy:
      resend.isPending ||
      turnOff.isPending ||
      turnOn.isPending ||
      remove.isPending,
  };
}
