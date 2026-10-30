// File : /TeamSamsara.Workflow/app/src/features/events/ui/CalendarItem.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : An item in a calendar day: an event (solid, with its type's colour
// on the edge, time and how many tasks are done) or a one-off task (dashed,
// with its time and status).

import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { StatusRecord } from "@/core/data";
import { StatusPill } from "@/features/task-setup";
import { statusOf, type TaskRecord } from "@/features/tasks";
import type { Progress } from "../hooks/useEvents";
import type { EventRecord } from "../types/eventTypes";
import { CalendarItemText as Text } from "./eventsContent";
import styles from "./CalendarItem.module.css";

interface EventItemProps {
  event: EventRecord;
  color: string | null;
  time: string;
  progress: Progress | undefined;
  href: string;
}

export function EventItem({
  event,
  color,
  time,
  progress,
  href,
}: EventItemProps) {
  const style = color
    ? ({ "--item-color": color } as CSSProperties)
    : undefined;
  const done =
    progress && progress.total > 0 && progress.done === progress.total;
  return (
    <Link to={href} className={styles.event} style={style}>
      <span className={styles.title}>{event.title}</span>
      <span className={styles.meta}>
        {time}
        {progress && progress.total > 0
          ? ` · ${done ? Text.allDone : Text.progress(progress.done, progress.total)}`
          : ""}
      </span>
    </Link>
  );
}

interface TaskItemProps {
  task: TaskRecord;
  statuses: readonly StatusRecord[];
  time: string;
  isLate: boolean;
  href: string;
}

export function TaskItem({
  task,
  statuses,
  time,
  isLate,
  href,
}: TaskItemProps) {
  const status = statusOf(task, statuses);
  return (
    <Link to={href} className={styles.task} data-late={isLate}>
      <span className={styles.title}>{task.title}</span>
      <span className={styles.meta}>
        {time}
        {isLate ? ` · ${Text.late}` : ""}
      </span>
      {status ? <StatusPill status={status} /> : null}
    </Link>
  );
}
