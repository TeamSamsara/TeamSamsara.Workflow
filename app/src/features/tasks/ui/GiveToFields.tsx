// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/GiveToFields.tsx
// Version : 1.1.0
// Latest commit: feature/1.2-workload-b
// Author : Gerrah
// Purpose : "Give to" for a task: a work group or a person; with a group, an
// optional person in it. The same choice as in the workflow editor. When the
// caller knows people's weeks, each person shows theirs, and people without
// room for the task can't be picked.

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
  /** Someone's week for this task: a word after their name, and whether they can be picked. */
  personWeek?: (member: MemberRecord) => {
    note: string | null;
    canPick: boolean;
  };
}

export function GiveToFields({
  value,
  onChange,
  groups,
  members,
  personWeek,
}: GiveToFieldsProps) {
  const weekOf = (member: MemberRecord) =>
    member.id === value.memberId
      ? { note: personWeek?.(member).note ?? null, canPick: true }
      : (personWeek?.(member) ?? { note: null, canPick: true });
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
        options={giveToOptions(groups, members).map((option) => {
          const member = option.value.startsWith("member:")
            ? members.find((entry) => `member:${entry.id}` === option.value)
            : undefined;
          if (!member || !personWeek) return option;
          const week = weekOf(member);
          return {
            ...option,
            label: [option.label, week.note].filter(Boolean).join(" · "),
            disabled: option.disabled || !week.canPick,
          };
        })}
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
              label: [memberName(member), weekOf(member).note]
                .filter(Boolean)
                .join(" · "),
              disabled: !weekOf(member).canPick,
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
