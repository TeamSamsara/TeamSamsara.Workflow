// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/TaskProgress.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The workspace's statuses as numbered steps, the task's own one
// marked, so anyone can see where it is. Closed statuses (like Skipped) only
// show when the task is in one.

import type { StatusRecord } from "@/core/data";
import { TaskProgressText as Text } from "./tasksContent";
import styles from "./TaskProgress.module.css";

export function TaskProgress({
  statuses,
  currentId,
}: {
  statuses: readonly StatusRecord[];
  currentId: string;
}) {
  const shown = [...statuses]
    .sort((a, b) => a.position - b.position)
    .filter(
      (status) => status.category !== "closed" || status.id === currentId,
    );
  const currentIndex = shown.findIndex((status) => status.id === currentId);

  return (
    <ol className={styles.steps} aria-label={Text.label}>
      {shown.map((status, index) => (
        <li
          key={status.id}
          className={styles.step}
          data-state={
            index < currentIndex
              ? "past"
              : index === currentIndex
                ? "current"
                : "next"
          }
          aria-current={index === currentIndex ? "step" : undefined}
        >
          <span className={styles.number}>{index + 1}</span>
          <span className={styles.name}>{status.name}</span>
        </li>
      ))}
    </ol>
  );
}
