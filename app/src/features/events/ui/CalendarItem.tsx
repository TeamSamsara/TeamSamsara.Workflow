// File : /TeamSamsara.Workflow/app/src/features/events/ui/CalendarItem.tsx
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : An item in a calendar day: an event (solid, with its type's colour
// on the edge, time and how many tasks are done; faded once over, with a ✓ or
// how many are left; a ⋯ menu for planners), a date a repeat skips, or a
// one-off task (dashed, with its time and status).

import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { StatusRecord } from "@/core/data";
import { StatusPill } from "@/features/task-setup";
import { statusOf, type TaskRecord } from "@/features/tasks";
import { VisuallyHidden } from "@/shared/components/VisuallyHidden/VisuallyHidden";
import { Icon } from "@/shared/icons/Icon";
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
  /** Part of a repeat: shows the repeat mark. */
  isRepeat?: boolean;
  /** Over already: faded, with a ✓ when every task is done or how many are left. */
  isPast?: boolean;
  /** The ⋯ menu, for planners. */
  actions?: ReactNode;
}

/** How a past event looks: all done, tasks left, or nothing to do. */
function pastState(progress: Progress | undefined): "done" | "open" | "none" {
  if (!progress || progress.total === 0) return "none";
  return progress.done === progress.total ? "done" : "open";
}

export function EventItem({
  event,
  color,
  time,
  progress,
  href,
  isRepeat = false,
  isPast = false,
  actions,
}: EventItemProps) {
  const style = color
    ? ({ "--item-color": color } as CSSProperties)
    : undefined;
  const state = isPast ? pastState(progress) : null;
  const done =
    progress && progress.total > 0 && progress.done === progress.total;
  const summary =
    !progress || progress.total === 0
      ? ""
      : state === "open"
        ? Text.left(progress.total - progress.done)
        : done
          ? Text.allDone
          : Text.progress(progress.done, progress.total);
  return (
    <div
      className={styles.eventWrap}
      style={style}
      data-past={isPast || undefined}
      data-state={state ?? undefined}
      data-has-actions={actions ? true : undefined}
    >
      <Link to={href} className={styles.event}>
        <span className={styles.titleRow}>
          {isRepeat ? (
            <>
              <Icon name="repeat" className={styles.mark} />
              <VisuallyHidden>{Text.repeats}: </VisuallyHidden>
            </>
          ) : null}
          <span className={styles.title}>{event.title}</span>
        </span>
        <span className={styles.meta}>
          {time}
          {summary ? (
            <>
              {" · "}
              <span className={styles.summary}>
                {state === "done" ? (
                  <Icon name="check" className={styles.check} strokeWidth={3} />
                ) : null}
                {summary}
              </span>
            </>
          ) : null}
        </span>
      </Link>
      {actions ? <span className={styles.actions}>{actions}</span> : null}
    </div>
  );
}

/** A date a repeat skips: shown faintly so it's clear it was left out on purpose. */
export function SkippedItem({ title, time }: { title: string; time: string }) {
  return (
    <div className={styles.skipped}>
      <span className={styles.titleRow}>
        <Icon name="skip" className={styles.mark} />
        <span className={styles.title}>{title}</span>
      </span>
      <span className={styles.meta}>
        {time} · {Text.skipped}
      </span>
    </div>
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
