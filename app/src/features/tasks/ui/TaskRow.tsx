// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/TaskRow.tsx
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : One task in a list: its title (opens the task), who it's given
// to, when it's due (red once late, with "Late from the start" when it was
// planned after that), and its status.

import { Link } from "react-router-dom";
import type { MemberRecord, StatusRecord } from "@/core/data";
import { StatusPill } from "@/features/task-setup";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import { Chip } from "@/shared/components/Chip/Chip";
import { Pill } from "@/shared/components/Pill/Pill";
import { Icon } from "@/shared/icons/Icon";
import { statusOf } from "../model/taskStatusFlow";
import type { TaskRecord } from "../types/taskTypes";
import { DueText, TaskRowText as Text } from "./tasksContent";
import styles from "./TaskRow.module.css";

export interface TaskListContext {
  statuses: readonly StatusRecord[];
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  /** "Today, 7:00 PM" for a due time. */
  formatDue: (dueAt: Date) => string;
  hrefFor: (taskId: string) => string;
  now: Date;
}

export function TaskRow({
  task,
  context,
}: {
  task: TaskRecord;
  context: TaskListContext;
}) {
  const group = context.groups.find((entry) => entry.id === task.workGroupId);
  const member = context.members.find((entry) => entry.id === task.memberId);
  const status = statusOf(task, context.statuses);
  const isLate =
    task.dueAt !== null && task.dueAt.getTime() < context.now.getTime();

  return (
    <li className={styles.row}>
      <Link to={context.hrefFor(task.id)} className={styles.title}>
        {task.title}
      </Link>
      <span className={styles.meta}>
        {group ? <Chip label={group.name} /> : null}
        {member ? <Chip label={memberName(member)} variant="outline" /> : null}
        {!group && !member ? (
          <span className={styles.muted}>{Text.unassigned}</span>
        ) : null}
        {task.dueAt ? (
          <span className={styles.due} data-late={isLate}>
            <Icon name="time" />
            {context.formatDue(task.dueAt)}
          </span>
        ) : null}
        {task.lateAtCreation ? (
          <Pill tone="muted">{DueText.lateFromStart}</Pill>
        ) : null}
        {status ? <StatusPill status={status} /> : null}
      </span>
    </li>
  );
}

interface TaskGroupCardProps {
  title: string;
  tasks: readonly TaskRecord[];
  context: TaskListContext;
  /** Shown under the title (why this list is here). */
  note?: string;
  tone?: "default" | "late";
}

export function TaskGroupCard({
  title,
  tasks,
  context,
  note,
  tone = "default",
}: TaskGroupCardProps) {
  return (
    <section className={styles.card} data-tone={tone} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.heading}>{title}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </header>
      {note ? <p className={styles.muted}>{note}</p> : null}
      <ul className={styles.list}>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} context={context} />
        ))}
      </ul>
    </section>
  );
}
