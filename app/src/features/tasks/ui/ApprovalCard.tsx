// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/ApprovalCard.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Where a task needing approval stands: who sent it for review and
// when, who approved it, or what changes were asked for.

import type { MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { TaskRecord } from "../types/taskTypes";
import { ApprovalText as Text } from "./tasksContent";
import styles from "./TaskCards.module.css";

interface ApprovalCardProps {
  task: TaskRecord;
  members: readonly MemberRecord[];
  formatWhen: (date: Date) => string;
}

export function ApprovalCard({ task, members, formatWhen }: ApprovalCardProps) {
  const nameOf = (id: string | null) => {
    const member = members.find((entry) => entry.id === id);
    return member ? memberName(member) : Text.someone;
  };

  return (
    <section className={styles.card} aria-labelledby="task-approval">
      <h2 id="task-approval" className={styles.title}>
        {Text.title}
      </h2>
      <p className={styles.muted}>{Text.needed}</p>
      {task.approvedAt ? (
        <p className={styles.notes}>
          {Text.approvedBy(
            nameOf(task.approvedBy),
            formatWhen(task.approvedAt),
          )}
        </p>
      ) : task.sentForReviewAt ? (
        <p className={styles.notes}>
          {Text.sentBy(
            nameOf(task.sentForReviewBy),
            formatWhen(task.sentForReviewAt),
          )}
        </p>
      ) : null}
      {task.changesRequested ? (
        <>
          <b>{Text.changes}</b>
          <p className={styles.quote}>{task.changesRequested}</p>
        </>
      ) : null}
    </section>
  );
}
