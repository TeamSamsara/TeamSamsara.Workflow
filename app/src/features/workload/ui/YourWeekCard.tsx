// File : /TeamSamsara.Workflow/app/src/features/workload/ui/YourWeekCard.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : My tasks' "Your week": this week in one word, what's in it, and
// who sets the usual week. The number itself stays with Owners and
// Administrators.

import { useWorkspaceRecord } from "@/core/workspace";
import {
  memberWeek,
  usualWeekOf,
  weekRange,
  type TaskForWeek,
} from "../model/week";
import { WeekPill } from "./WeekPill";
import { WorkloadText as Text, WeekStateText } from "./workloadContent";
import styles from "./Workload.module.css";

interface YourWeekCardProps {
  member: { id: string; usualWeek: number | null };
  /** Their open tasks (others are left out). */
  tasks: readonly TaskForWeek[];
  now: Date;
}

export function YourWeekCard({ member, tasks, now }: YourWeekCardProps) {
  const workspace = useWorkspaceRecord();
  const week = memberWeek(
    member.id,
    usualWeekOf(member, workspace),
    tasks,
    now,
    workspace,
  );
  return (
    <section className={styles.card} aria-labelledby="your-week-title">
      <div className={styles.row}>
        <h2 id="your-week-title" className={styles.title}>
          {Text.yourWeek}
        </h2>
        <WeekPill state={week.state} />
      </div>
      <p className={styles.muted}>
        {Text.weekSummary(
          weekRange(week, workspace.timeZone),
          week.tasks,
          week.bigger,
        )}
        . {WeekStateText[week.state].meaning}.
      </p>
      <p className={styles.muted}>{Text.yourWeekNote}</p>
    </section>
  );
}
