// File : /TeamSamsara.Workflow/app/src/features/workload/ui/MemberWorkloadCard.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : Workload on a member's settings page: this week in a word and
// what's in it, the coming weeks, and their usual week, which Owners and
// Administrators set (through the server, which keeps it in Activity).

import { useMutation } from "@tanstack/react-query";
import { WorkloadLimits } from "@engine/workload";
import { manage, manageRefusal } from "@/core/access";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { memberName } from "@/features/members";
import { Select } from "@/shared/components/Fields/Select/Select";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  comingWeeks,
  memberWeek,
  usualWeekOf,
  weekRange,
  type TaskForWeek,
} from "../model/week";
import { WeekPill } from "./WeekPill";
import { WorkloadText as Text } from "./workloadContent";
import styles from "./Workload.module.css";

interface MemberWorkloadCardProps {
  member: MemberRecord;
  /** Their open tasks. */
  tasks: readonly TaskForWeek[];
  now: Date;
  /** Owners and Administrators: may change the usual week. */
  canSet: boolean;
}

/** The choices offered: 1 to 15 a week, and whatever it's set to now. */
function weekChoices(current: number | null): number[] {
  const choices = Array.from({ length: 15 }, (_, index) => index + 1);
  if (current !== null && !choices.includes(current)) choices.push(current);
  return choices.filter((value) => value <= WorkloadLimits.person.max);
}

export function MemberWorkloadCard({
  member,
  tasks,
  now,
  canSet,
}: MemberWorkloadCardProps) {
  const workspace = useWorkspaceRecord();
  const toast = useToast();
  const name = memberName(member);
  const usual = usualWeekOf(member, workspace);
  const week = memberWeek(member.id, usual, tasks, now, workspace);
  const coming = comingWeeks(member.id, usual, tasks, now, workspace, 3);
  const save = useMutation({
    mutationFn: (usualWeek: number | null) =>
      manage({ op: "member.update", memberId: member.id, usualWeek }),
    onSuccess: () => toast.show({ tone: "success", title: Text.saved }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.failed,
        detail:
          manageRefusal(error) === "missingPermission"
            ? Text.adminsOnly
            : dataErrorMessage(error),
      }),
  });

  return (
    <section className={styles.card} aria-labelledby="member-workload-title">
      <h3 id="member-workload-title" className={styles.title}>
        {Text.workloadHeading}
      </h3>
      <div className={styles.row}>
        <div>
          <h4 className={styles.subheading}>{Text.thisWeek}</h4>
          <p className={styles.muted}>
            {Text.weekSummary(
              weekRange(week, workspace.timeZone),
              week.tasks,
              week.bigger,
            )}
          </p>
        </div>
        <WeekPill state={week.state} />
      </div>

      <Select
        label={Text.memberTitle(name)}
        help={Text.memberHelp(name)}
        options={[
          { value: "", label: Text.followWorkspace(workspace.usualWeek) },
          ...weekChoices(member.usualWeek).map((value) => ({
            value: String(value),
            label: Text.usualWeek(value),
          })),
        ]}
        value={member.usualWeek === null ? "" : String(member.usualWeek)}
        onChange={(event) =>
          save.mutate(event.target.value ? Number(event.target.value) : null)
        }
        hint={canSet ? undefined : Text.adminsOnly}
        disabled={!canSet || save.isPending}
      />

      <div className={styles.list}>
        <h4 className={styles.subheading}>{Text.comingWeeks}</h4>
        <ul className={styles.list}>
          {coming.map((entry) => (
            <li key={entry.start.toISOString()} className={styles.row}>
              <span className={styles.muted}>
                {weekRange(entry, workspace.timeZone)}
              </span>
              <WeekPill state={entry.state} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
