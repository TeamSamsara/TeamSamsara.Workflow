// File : /TeamSamsara.Workflow/app/src/features/availability/ui/HourPanel.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The side panel of Team availability for the picked hour: who's
// free, who's busy or unavailable (with what, where they shared it), who
// hasn't filled in, and Plan an event then. Under it, the times when everyone
// shown is free; picking one moves the panel there.

import { LinkButton } from "@/shared/components/Button/LinkButton";
import { TeamViewText as Text } from "./teamViewContent";
import styles from "./TeamView.module.css";

export interface PanelPerson {
  id: string;
  name: string;
  /** A shared appointment's title, for people busy with one. */
  note?: string;
}

interface HourPanelProps {
  title: string;
  subtitle: string;
  free: readonly PanelPerson[];
  busy: readonly PanelPerson[];
  unknown: readonly PanelPerson[];
  planHref: string | null;
  best: readonly { key: string; label: string; onPick: () => void }[];
}

function names(people: readonly PanelPerson[]): string {
  if (people.length === 0) return Text.nobody;
  return people
    .map((person) =>
      person.note ? `${person.name} (${person.note})` : person.name,
    )
    .join(", ");
}

export function HourPanel({
  title,
  subtitle,
  free,
  busy,
  unknown,
  planHref,
  best,
}: HourPanelProps) {
  return (
    <aside className={styles.panel}>
      <section className={styles.panelCard} aria-labelledby="picked-hour">
        <h2 id="picked-hour" className={styles.panelTitle}>
          {title}
        </h2>
        <span className={styles.muted}>{subtitle}</span>
        <div className={styles.panelGroup}>
          <b className={styles.freeHead}>{Text.free(free.length)}</b>
          <span>{names(free)}</span>
        </div>
        <div className={styles.panelGroup}>
          <b className={styles.busyHead}>{Text.busy(busy.length)}</b>
          <span>{names(busy)}</span>
        </div>
        <div className={styles.panelGroup}>
          <b className={styles.unknownHead}>{Text.unknown(unknown.length)}</b>
          <span>
            {unknown.length === 0 ? Text.everyoneFilled : names(unknown)}
          </span>
        </div>
        {planHref ? (
          <LinkButton to={planHref} variant="primary" iconStart="add">
            {Text.planThen}
          </LinkButton>
        ) : null}
      </section>
      <section
        className={styles.panelCard}
        aria-labelledby="best-times"
        data-tour="teamBest"
      >
        <h3 id="best-times" className={styles.bestTitle}>
          {Text.bestTitle}
        </h3>
        {best.length === 0 ? (
          <span className={styles.muted}>{Text.noBest}</span>
        ) : (
          <div className={styles.bestList}>
            {best.map((slot) => (
              <button
                key={slot.key}
                type="button"
                className={styles.bestChip}
                onClick={slot.onPick}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
        <span className={styles.muted}>{Text.bestNote}</span>
      </section>
    </aside>
  );
}
