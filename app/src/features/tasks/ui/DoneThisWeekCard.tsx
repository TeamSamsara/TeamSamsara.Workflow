// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/DoneThisWeekCard.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The side card on My tasks: how many tasks were done this week,
// a bar per day (today's highlighted), and a button to the Done this week tab.

import { Button } from "@/shared/components/Button/Button";
import { DoneThisWeekText as Text } from "./tasksContent";
import styles from "./DoneThisWeekCard.module.css";

interface DoneThisWeekCardProps {
  /** Done each day of the week, first day first. */
  counts: readonly number[];
  /** "M", "T"… in the week's order. */
  dayLetters: readonly string[];
  /** Which day of the week is today (0 for the first). */
  todayIndex: number;
  onOpen: () => void;
}

export function DoneThisWeekCard({
  counts,
  dayLetters,
  todayIndex,
  onOpen,
}: DoneThisWeekCardProps) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const most = Math.max(1, ...counts);
  return (
    <section className={styles.card} aria-labelledby="done-this-week">
      <div className={styles.head}>
        <h2 id="done-this-week" className={styles.title}>
          {Text.title}
        </h2>
        <b className={styles.total}>{total}</b>
      </div>
      <ol className={styles.week} aria-label={Text.byDay}>
        {counts.map((count, index) => (
          <li
            key={index}
            className={styles.day}
            data-today={index === todayIndex || undefined}
          >
            <span
              className={styles.bar}
              data-empty={count === 0 || undefined}
              style={{ height: count === 0 ? 3 : 8 + (count / most) * 28 }}
            />
            <span aria-hidden="true">{dayLetters[index]}</span>
            <span className={styles.hidden}>
              {Text.dayCount(dayLetters[index], count)}
            </span>
          </li>
        ))}
      </ol>
      <Button variant="ghost" size="small" iconEnd="next" onClick={onOpen}>
        {Text.open}
      </Button>
    </section>
  );
}
