// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/giveToOptions.ts
// Version : 1.2.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : The "Give to" choices: no one yet, then the work groups, then the
// people, each under its heading. People above the editor's rank show but
// can't be picked (a workflow names only people at or below them). Also who a
// step goes to, in words, for the Reads-as sentence.

import type { MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import type { SelectOption } from "@/shared/components/Fields/Select/Select";
import type { WorkflowStep } from "../types/workflowTypes";
import type { StepEditorOptions } from "./StepEditor";
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

/** Who a step goes to, in words, for the Reads-as sentence. */
export function whoInWords(
  step: WorkflowStep,
  options: StepEditorOptions,
): string | null {
  const group = options.groups.find((entry) => entry.id === step.workGroupId);
  const named = options.members.find((entry) => entry.id === step.memberId);
  if (named) return memberName(named);
  if (group)
    return group.assign.on
      ? Text.groupLeastBusy(group.name)
      : Text.anyoneIn(group.name);
  return null;
}
