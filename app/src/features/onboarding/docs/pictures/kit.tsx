// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/kit.tsx
// Version : 1.0.1
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The pieces the help's pictures are drawn from: small versions of
// Playbook's cards, rows, pills, faces and tabs, plus numbered marks that
// light up when their callout is picked beside the picture. Pictures are
// decoration (the words around them say the same), so none of this is
// focusable.

import { useContext, type CSSProperties, type ReactNode } from "react";
import { ActiveCallout } from "./activeCallout";
import styles from "./Kit.module.css";

export function Scene({
  children,
  height,
  style,
}: {
  children: ReactNode;
  height?: number;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.scene} style={{ minHeight: height, ...style }}>
      {children}
    </div>
  );
}

export function Panel({
  title,
  children,
  pop,
  style,
}: {
  title?: string;
  children: ReactNode;
  pop?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={`${styles.panel} ${pop ? styles.pop : ""}`} style={style}>
      {title ? <div className={styles.panelTitle}>{title}</div> : null}
      {children}
    </div>
  );
}

export function Row({
  children,
  glow,
  style,
}: {
  children: ReactNode;
  glow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.row} data-glow={glow ?? false} style={style}>
      {children}
    </div>
  );
}

/** A title with a smaller line under it, taking the row's free space. */
export function Text({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <span className={styles.grow}>
      <span className={styles.title}>{title}</span>
      {sub ? <span className={styles.small}>{sub}</span> : null}
    </span>
  );
}

export const Small = ({ children }: { children: ReactNode }) => (
  <span className={styles.small}>{children}</span>
);

export const Heading = ({ children }: { children: ReactNode }) => (
  <span className={styles.heading}>{children}</span>
);

export type Tone = "accent" | "info" | "warn" | "alert" | "neutral" | "outline";

export const Chip = ({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) => (
  <span className={styles.chip} data-tone={tone}>
    {children}
  </span>
);

export const Face = ({ initials }: { initials: string }) => (
  <span className={styles.face}>{initials}</span>
);

export function Tabs({ items, on }: { items: readonly string[]; on: number }) {
  return (
    <span className={styles.tabs}>
      {items.map((item, index) => (
        <span key={item} className={styles.tab} data-on={index === on}>
          {item}
        </span>
      ))}
    </span>
  );
}

export function Segments({
  items,
  on,
}: {
  items: readonly string[];
  on: number;
}) {
  return (
    <span className={styles.segments}>
      {items.map((item, index) => (
        <span key={item} className={styles.segment} data-on={index === on}>
          {item}
        </span>
      ))}
    </span>
  );
}

export const FakeButton = ({
  children,
  primary,
}: {
  children: ReactNode;
  primary?: boolean;
}) => (
  <span className={styles.button} data-primary={primary ?? false}>
    {children}
  </span>
);

export const Field = ({ children }: { children: ReactNode }) => (
  <span className={styles.field}>{children}</span>
);

export const Strike = ({ children }: { children: ReactNode }) => (
  <span className={styles.strike}>{children}</span>
);

export const Arrow = ({ children = "↓" }: { children?: ReactNode }) => (
  <span className={styles.arrow}>{children}</span>
);

/**
 * Something a callout points at, with its number beside it: outlined while
 * its callout is picked. n = 0 outlines it without a number.
 */
export function Spot({ n, children }: { n: number; children: ReactNode }) {
  const active = useContext(ActiveCallout);
  const on = active === n || n === 0;
  return (
    <span className={styles.spot}>
      {n > 0 ? (
        <span className={styles.mark} data-on={active === n}>
          {n}
        </span>
      ) : null}
      <span className={styles.ring} data-on={on}>
        {children}
      </span>
    </span>
  );
}

/** A tick box or a choice, ticked or not, with its words. */
export const Check = ({
  on,
  round,
  children,
}: {
  on?: boolean;
  round?: boolean;
  children: ReactNode;
}) => (
  <span className={styles.check}>
    <span
      className={styles.box}
      data-on={on ?? false}
      data-round={round ?? false}
    />
    {children}
  </span>
);

/** An on/off switch. */
export const Switch = ({ on }: { on?: boolean }) => (
  <span className={styles.switch} data-on={on ?? false}>
    <span className={styles.knob} />
  </span>
);

/** A count with its label, as on an event's replies. */
export const Count = ({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone?: Tone;
}) => (
  <span className={styles.count} data-tone={tone ?? "neutral"}>
    <b>{n}</b>
    <span>{label}</span>
  </span>
);
