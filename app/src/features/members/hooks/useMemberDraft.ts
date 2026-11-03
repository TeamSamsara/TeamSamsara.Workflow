// File : /TeamSamsara.Workflow/app/src/features/members/hooks/useMemberDraft.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The unsaved edits on a member's page (name, roles, work groups),
// with Reset and Save. Follows the saved member while nothing is being edited.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { TextLimits } from "@/shared/validation/textLimits";
import { ValidationText } from "@/shared/validation/validationContent";
import { saveMemberDetails } from "../service/memberService";
import type { MemberDetails } from "../types/memberTypes";

interface Edits {
  memberId: string;
  details: MemberDetails;
  committed: boolean;
}

const same = (a: MemberDetails, b: MemberDetails) =>
  a.displayName === b.displayName &&
  a.roleIds.join() === b.roleIds.join() &&
  a.workGroupIds.join() === b.workGroupIds.join();

export interface MemberDraft {
  details: MemberDetails;
  isDirty: boolean;
  nameError: string | undefined;
  change: (changes: Partial<MemberDetails>) => void;
  reset: () => void;
  save: (onSaved?: () => void) => void;
  isSaving: boolean;
  saveError: string | null;
}

export function useMemberDraft(member: MemberRecord): MemberDraft {
  const saved: MemberDetails = {
    displayName: member.displayName,
    roleIds: member.roleIds,
    workGroupIds: member.workGroupIds,
  };
  const [edits, setEdits] = useState<Edits | null>(null);

  if (edits?.committed && same(edits.details, saved)) {
    setEdits(null);
  }

  const details = edits && edits.memberId === member.id ? edits.details : saved;
  const mutation = useMutation({
    mutationFn: (next: MemberDetails) => saveMemberDetails(member.id, next),
  });
  // A name is optional (the email shows until there is one), but not too long.
  const nameError =
    details.displayName.trim().length > TextLimits.name
      ? ValidationText.nameTooLong(TextLimits.name)
      : undefined;

  return {
    details,
    isDirty: !same(details, saved),
    nameError,
    change: (changes) => {
      setEdits({
        memberId: member.id,
        details: { ...details, ...changes },
        committed: false,
      });
      if (mutation.error) mutation.reset();
    },
    reset: () => {
      setEdits(null);
      mutation.reset();
    },
    save: (onSaved) => {
      if (nameError) return;
      const toSave = { ...details, displayName: details.displayName.trim() };
      mutation.mutate(toSave, {
        onSuccess: () => {
          setEdits({ memberId: member.id, details: toSave, committed: true });
          onSaved?.();
        },
      });
    },
    isSaving: mutation.isPending,
    saveError: mutation.error ? dataErrorMessage(mutation.error) : null,
  };
}
