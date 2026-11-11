// File : /TeamSamsara.Workflow/app/src/features/events/ui/LateTasksNotice.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The yellow warning when planning makes tasks whose due time has
// already passed: which ones and when they were due, then the choice to make
// them as late (the default) or leave them out.

import { useId } from "react";
import { Icon } from "@/shared/icons/Icon";
import type { LateChoice, LateTask } from "../model/lateTasks";
import { LateTasksText as Text } from "./lateTasksContent";
import styles from "./LateTasksNotice.module.css";

/** How many late tasks are listed before "and N more". */
const listed = 5;

interface LateTasksNoticeProps {
  tasks: readonly LateTask[];
  choice: LateChoice;
  onChange: (choice: LateChoice) => void;
  /** "Fri, Nov 6, 8:00 PM", in the viewer's time. */
  formatWhen: (date: Date) => string;
  disabled?: boolean;
}

export function LateTasksNotice({
  tasks,
  choice,
  onChange,
  formatWhen,
  disabled = false,
}: LateTasksNoticeProps) {
  const name = useId();
  if (tasks.length === 0) return null;
  const events = new Set(
    tasks.map((task) => `${task.eventTitle}:${task.eventStart.getTime()}`),
  );
  const first = tasks[0];

  return (
    <section className={styles.notice} aria-labelledby={`${name}-title`}>
      <h3 id={`${name}-title`} className={styles.title}>
        <Icon name="warning" className={styles.icon} />
        {Text.title(tasks.length)}
      </h3>
      <p className={styles.help}>
        {events.size === 1
          ? Text.oneEvent(formatWhen(first.eventStart))
          : Text.severalEvents}
      </p>
      <ul className={styles.list}>
        {tasks.slice(0, listed).map((task, index) => (
          <li key={`${task.eventTitle}:${task.title}:${index}`}>
            <b>{task.title}</b>
            {events.size > 1 ? ` · ${task.eventTitle}` : null}
            {": "}
            {formatWhen(task.dueAt)}
          </li>
        ))}
        {tasks.length > listed ? (
          <li className={styles.more}>{Text.more(tasks.length - listed)}</li>
        ) : null}
      </ul>
      <fieldset className={styles.choices} disabled={disabled}>
        <legend className={styles.legend}>{Text.choices}</legend>
        {(
          [
            ["late", Text.late, Text.lateHelp],
            ["skip", Text.skip, Text.skipHelp],
          ] as const
        ).map(([value, label, help]) => (
          <label key={value} className={styles.choice}>
            <input
              type="radio"
              name={name}
              checked={choice === value}
              onChange={() => onChange(value)}
            />
            <span className={styles.choiceText}>
              <b>{label}</b>
              <span className={styles.help}>{help}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
