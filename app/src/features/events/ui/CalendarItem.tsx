// File : /TeamSamsara.Workflow/app/src/features/events/ui/CalendarItem.tsx
// Version : 1.4.0
// Latest commit: feature/lean-calendar
// Author : Gerrah
// Purpose : An item in a calendar day: an event (solid, with its type's colour
// on the edge, time and how many tasks are done; faded once over, with a ✓ or
// how many are left; a ⋯ menu for planners), a date a repeat skips, or a
// one-off task (dashed, with its time and status). In the month view both are
// lean: one line each, the event's tasks done shown as a small badge.

import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { StatusRecord } from "@/core/data";
import { useSession } from "@/core/session";
import { StatusPill } from "@/features/task-setup";
import { statusOf, type TaskRecord } from "@/features/tasks";
import { VisuallyHidden } from "@/shared/components/VisuallyHidden/VisuallyHidden";
import { Icon } from "@/shared/icons/Icon";
import type { Progress } from "../hooks/useEvents";
import { myReply } from "../model/attendance";
import type { EventRecord } from "../types/eventTypes";
import { replyMarks } from "./attendanceContent";
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
  /** The member is in it themselves (not only through a group): outlined. */
  isMine?: boolean;
  /** Where it sits in the week view; it then fills that block. */
  layout?: CSSProperties | null;
  /** A short block: title and time on one line each. */
  compact?: boolean;
  /** The month view: one line, the title and a badge of tasks done. */
  lean?: boolean;
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
  isMine = false,
  layout,
  compact = false,
  lean = false,
}: EventItemProps) {
  const style = {
    ...(color ? { "--item-color": color } : {}),
    ...(layout ?? {}),
  } as CSSProperties;
  const session = useSession();
  const reply = myReply(
    event,
    session.status === "active" ? session.member : null,
  );
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
      data-mine={isMine || undefined}
      data-block={layout ? true : undefined}
      data-compact={compact || undefined}
      data-lean={lean || undefined}
      data-reply={reply ?? undefined}
    >
      <Link
        to={href}
        className={styles.event}
        title={
          lean
            ? [event.title, time, summary].filter(Boolean).join(" · ")
            : undefined
        }
      >
        <span className={styles.titleRow}>
          {isRepeat ? (
            <>
              <Icon name="repeat" className={styles.mark} />
              <VisuallyHidden>{Text.repeats}: </VisuallyHidden>
            </>
          ) : null}
          {reply ? (
            <>
              <span className={styles.reply} data-reply={reply} aria-hidden>
                {reply === "going" ? (
                  <Icon name="check" strokeWidth={3} />
                ) : reply === "maybe" ? (
                  "?"
                ) : reply === "cant" ? null : (
                  "●"
                )}
              </span>
              <VisuallyHidden>{replyMarks[reply]}: </VisuallyHidden>
            </>
          ) : null}
          <span className={styles.title}>{event.title}</span>
        </span>
        {lean ? (
          <>
            <VisuallyHidden>
              , {time}
              {summary ? `, ${summary}` : ""}
            </VisuallyHidden>
            {progress && progress.total > 0 ? (
              <span className={styles.badge} aria-hidden>
                {done ? (
                  <Icon name="check" className={styles.check} strokeWidth={3} />
                ) : (
                  `${progress.done}/${progress.total}`
                )}
              </span>
            ) : null}
          </>
        ) : (
          <span className={styles.meta}>
            {time}
            {summary ? (
              <>
                {" · "}
                <span className={styles.summary}>
                  {state === "done" ? (
                    <Icon
                      name="check"
                      className={styles.check}
                      strokeWidth={3}
                    />
                  ) : null}
                  {summary}
                </span>
              </>
            ) : null}
          </span>
        )}
      </Link>
      {actions ? <span className={styles.actions}>{actions}</span> : null}
    </div>
  );
}

/** A date a repeat skips: shown faintly so it's clear it was left out on purpose. */
export function SkippedItem({
  title,
  time,
  layout,
}: {
  title: string;
  time: string;
  layout?: CSSProperties | null;
}) {
  return (
    <div
      className={styles.skipped}
      data-block={layout ? true : undefined}
      style={layout ?? undefined}
    >
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
  /** Where it sits in the week view. */
  layout?: CSSProperties | null;
  /** The month view: one line, the title and its time. */
  lean?: boolean;
}

export function TaskItem({
  task,
  statuses,
  time,
  isLate,
  href,
  layout,
  lean = false,
}: TaskItemProps) {
  const status = statusOf(task, statuses);
  return (
    <Link
      to={href}
      className={styles.task}
      title={lean ? `${task.title} · ${time}` : undefined}
      data-lean={lean || undefined}
      data-late={isLate}
      data-block={layout ? true : undefined}
      style={layout ?? undefined}
    >
      <span className={styles.title}>{task.title}</span>
      <span className={styles.meta}>
        {time}
        {isLate ? ` · ${Text.late}` : ""}
      </span>
      {status && !lean ? <StatusPill status={status} /> : null}
    </Link>
  );
}
