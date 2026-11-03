// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/GiveToFields.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : "Give to" for a task: a work group or a person; with a group, an
// optional person in it. The same choice as in the workflow editor.

import type { MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import { giveToOptions, giveToValue, parseGiveTo } from "@/features/workflows";
import { Select } from "@/shared/components/Fields/Select/Select";
import { GiveToText as Text } from "./tasksContent";
import styles from "./TaskForm.module.css";

export interface Assignee {
  workGroupId: string | null;
  memberId: string | null;
}

interface GiveToFieldsProps {
  value: Assignee;
  onChange: (value: Assignee) => void;
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
}

export function GiveToFields({
  value,
  onChange,
  groups,
  members,
}: GiveToFieldsProps) {
  const group = groups.find((entry) => entry.id === value.workGroupId);
  const inGroup = group
    ? members
        .filter(
          (member) =>
            member.workGroupIds.includes(group.id) ||
            member.id === value.memberId,
        )
        .sort((a, b) => memberName(a).localeCompare(memberName(b)))
    : [];

  return (
    <div className={styles.pair}>
      <Select
        label={Text.giveTo}
        help={Text.giveToHelp}
        options={giveToOptions(groups, members)}
        value={giveToValue(value)}
        onChange={(event) => onChange(parseGiveTo(event.target.value))}
      />
      {group ? (
        <Select
          label={Text.whoInGroup(group.name)}
          options={[
            { value: "", label: Text.anyoneInGroup(group.name) },
            ...inGroup.map((member) => ({
              value: member.id,
              label: memberName(member),
            })),
          ]}
          value={value.memberId ?? ""}
          onChange={(event) =>
            onChange({ ...value, memberId: event.target.value || null })
          }
        />
      ) : null}
    </div>
  );
}
