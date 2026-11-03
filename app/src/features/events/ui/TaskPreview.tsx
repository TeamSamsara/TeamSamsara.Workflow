// File : /TeamSamsara.Workflow/app/src/features/events/ui/TaskPreview.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : The tasks a new event will make, before it's made: each with who
// it's given to and its real due time, earliest first.

import type { MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import { Chip } from "@/shared/components/Chip/Chip";
import type { PlannedTask } from "../model/applyWorkflows";
import { TaskPreviewText as Text } from "./eventsContent";
import styles from "./EventPanels.module.css";

interface TaskPreviewProps {
  tasks: readonly PlannedTask[];
  hasDate: boolean;
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  formatDue: (dueAt: Date) => string;
}

export function TaskPreview({
  tasks,
  hasDate,
  groups,
  members,
  formatDue,
}: TaskPreviewProps) {
  return (
    <section className={styles.card} aria-labelledby="task-preview">
      <h2 id="task-preview" className={styles.title}>
        {Text.title}
      </h2>
      {tasks.length === 0 ? (
        <p className={styles.muted}>{Text.none}</p>
      ) : (
        <>
          {!hasDate ? <p className={styles.muted}>{Text.pickDate}</p> : null}
          <ul className={styles.preview}>
            {tasks.map((task) => {
              const group = groups.find(
                (entry) => entry.id === task.workGroupId,
              );
              const member = members.find(
                (entry) => entry.id === task.memberId,
              );
              return (
                <li
                  key={`${task.workflowId}:${task.stepId}`}
                  className={styles.previewRow}
                >
                  <span className={styles.previewTitle}>{task.title}</span>
                  <span className={styles.previewMeta}>
                    {group ? <Chip label={group.name} /> : null}
                    {member ? (
                      <Chip label={memberName(member)} variant="outline" />
                    ) : null}
                    {!group && !member ? <span>{Text.unassigned}</span> : null}
                    {hasDate && task.dueAt ? (
                      <span>{formatDue(task.dueAt)}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
