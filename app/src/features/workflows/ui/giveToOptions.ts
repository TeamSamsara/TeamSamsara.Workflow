// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/giveToOptions.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The "Give to" choices: no one yet, then the work groups, then the
// people, each under its heading. People above the editor's rank show but
// can't be picked (a workflow names only people at or below them).

import type { MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import type { SelectOption } from "@/shared/components/Fields/Select/Select";
import { StepEditorText as Text } from "./workflowsContent";

export const byMemberName = (a: MemberRecord, b: MemberRecord) =>
  memberName(a).localeCompare(memberName(b));

export function giveToOptions(
  groups: readonly WorkGroupRecord[],
  members: readonly MemberRecord[],
  canName: (member: MemberRecord) => boolean = () => true,
): SelectOption[] {
  return [
    { value: "", label: Text.nobody },
    ...groups.map((group) => ({
      value: `group:${group.id}`,
      label: group.name,
      group: Text.groups,
    })),
    ...[...members].sort(byMemberName).map((member) => ({
      value: `member:${member.id}`,
      label: canName(member)
        ? memberName(member)
        : Text.aboveRank(memberName(member)),
      disabled: !canName(member),
      group: Text.people,
    })),
  ];
}
