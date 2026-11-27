// File : /TeamSamsara.Workflow/app/src/features/workload/ui/GroupWeeksCard.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : A group's next four weeks, each in a word, from its usual week
// and the tasks it already has. Nothing shows for a group with no usual week.

import { useWorkspaceRecord } from "@/core/workspace";
import { useGroupWeeks } from "../hooks/useGroupWeeks";
import { groupComingWeeks } from "../model/warnings";
import { weekRange } from "../model/week";
import { WeekPill } from "./WeekPill";
import { WorkloadText as Text } from "./workloadContent";
import styles from "./Workload.module.css";

export function GroupWeeksCard({
  groupId,
  groupName,
  now,
}: {
  groupId: string;
  groupName: string;
  now: Date;
}) {
  const workspace = useWorkspaceRecord();
  const record = useGroupWeeks([groupId]).get(groupId);
  const weeks = record ? groupComingWeeks(record, now, workspace, 4) : [];
  if (weeks.length === 0) return null;
  return (
    <section className={styles.card} aria-labelledby="group-weeks-title">
      <h2 id="group-weeks-title" className={styles.title}>
        {Text.groupWeeks(groupName)}
      </h2>
      <ul className={styles.list}>
        {weeks.map((week) => (
          <li key={week.start.toISOString()} className={styles.row}>
            <span className={styles.muted}>
              {weekRange(week, workspace.timeZone)}
            </span>
            <WeekPill state={week.state} />
          </li>
        ))}
      </ul>
      <p className={styles.muted}>{Text.groupWeeksNote}</p>
    </section>
  );
}
