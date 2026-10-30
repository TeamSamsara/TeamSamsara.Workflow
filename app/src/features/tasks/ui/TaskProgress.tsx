// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/TaskProgress.tsx
// Version : 1.1.0
// Latest commit: fix/task-progress-contrast
// Author : Gerrah
// Purpose : The workspace's statuses as a connected stepper, so anyone can see
// where a task is: steps it has passed are filled with a tick, the current one
// is solid and bold, the rest are outlined. Closed statuses (like Skipped)
// only show when the task is in one.

import type { StatusRecord } from "@/core/data";
import { Icon } from "@/shared/icons/Icon";
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
  // A finished task's last step reads as done too, not as one still to do.
  const isFinished = shown[currentIndex]?.category === "finished";

  return (
    <ol className={styles.steps} aria-label={Text.label}>
      {shown.map((status, index) => {
        const state =
          index < currentIndex
            ? "past"
            : index === currentIndex
              ? "current"
              : "next";
        return (
          <li
            key={status.id}
            className={styles.step}
            data-state={state}
            data-finished={state === "current" && isFinished}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {state === "past" || (state === "current" && isFinished) ? (
                <Icon name="check" strokeWidth={3} />
              ) : (
                index + 1
              )}
            </span>
            <span className={styles.name}>{status.name}</span>
          </li>
        );
      })}
    </ol>
  );
}
