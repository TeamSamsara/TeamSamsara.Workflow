// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/TaskRow.tsx
// Version : 1.2.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : One task in a list: its title (opens the task) with its event
// under it (a link, or "Event deleted"), who it's given to, when it's due
// (red once late, with "Late from the start" when it was planned after that),
// and its status. Finished tasks show when they were done and by whom.

import type { ReactNode } from "react";
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

/** The event a task belongs to, as its row shows it. */
export interface TaskEventLink {
  /** "vs. Kitsune · Fri, Nov 13". */
  label: string;
  href: string;
}

export interface TaskListContext {
  statuses: readonly StatusRecord[];
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  /** "Today, 7:00 PM" for a due time. */
  formatDue: (dueAt: Date) => string;
  hrefFor: (taskId: string) => string;
  now: Date;
  /** The task's event, when it has one the viewer can see. */
  eventOf?: (task: TaskRecord) => TaskEventLink | null;
  /** For finished tasks: "Done by Sam · approved by Jordan". */
  doneNote?: (task: TaskRecord) => string | null;
}

export function TaskRow({
  task,
  context,
  action,
}: {
  task: TaskRecord;
  context: TaskListContext;
  /** A button at the end of the row, like Claim. */
  action?: ReactNode;
}) {
  const group = context.groups.find((entry) => entry.id === task.workGroupId);
  const member = context.members.find((entry) => entry.id === task.memberId);
  const status = statusOf(task, context.statuses);
  const isDone = task.doneAt !== null;
  const isLate =
    !isDone &&
    task.dueAt !== null &&
    task.dueAt.getTime() < context.now.getTime();
  const event = context.eventOf?.(task) ?? null;
  const note = isDone ? (context.doneNote?.(task) ?? null) : null;

  return (
    <li className={styles.row} data-done={isDone || undefined}>
      <span className={styles.lead}>
        <Link to={context.hrefFor(task.id)} className={styles.title}>
          {task.title}
        </Link>
        {note ? <span className={styles.muted}>{note}</span> : null}
        {event ? (
          <Link to={event.href} className={styles.event}>
            <Icon name="calendar" />
            {event.label}
          </Link>
        ) : task.eventGone ? (
          <span className={styles.gone}>
            <Icon name="calendar" />
            {Text.eventGone(
              task.eventGone.title,
              task.eventGone.startsAt
                ? context.formatDue(task.eventGone.startsAt)
                : null,
            )}
          </span>
        ) : null}
      </span>
      <span className={styles.meta}>
        {group ? <Chip label={group.name} /> : null}
        {member ? <Chip label={memberName(member)} variant="outline" /> : null}
        {!group && !member ? (
          <span className={styles.muted}>{Text.unassigned}</span>
        ) : null}
        {isDone && task.doneAt ? (
          <span className={styles.due}>
            <Icon name="check" />
            {Text.doneAt(context.formatDue(task.doneAt))}
          </span>
        ) : task.dueAt ? (
          <span className={styles.due} data-late={isLate}>
            <Icon name="time" />
            {context.formatDue(task.dueAt)}
          </span>
        ) : null}
        {task.lateAtCreation && !isDone ? (
          <Pill tone="muted">{DueText.lateFromStart}</Pill>
        ) : null}
        {status ? <StatusPill status={status} /> : null}
        {action}
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
  /** late: a red edge. waiting: a dashed edge, for tasks waiting for someone. */
  tone?: "default" | "late" | "waiting";
  /** A button at the end of each row, like Claim. */
  actionFor?: (task: TaskRecord) => ReactNode;
}

export function TaskGroupCard({
  title,
  tasks,
  context,
  note,
  tone = "default",
  actionFor,
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
          <TaskRow
            key={task.id}
            task={task}
            context={context}
            action={actionFor?.(task)}
          />
        ))}
      </ul>
    </section>
  );
}
