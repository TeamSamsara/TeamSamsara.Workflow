// File : /TeamSamsara.Workflow/app/src/shared/components/StatusPanel/StatusPanel.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A centred message that takes the place of a page or a form: an icon in a tile, a
// title, a few lines and the actions (check your inbox, link expired, no access, nothing
// here yet).

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import styles from "./StatusPanel.module.css";

export type StatusPanelTone = "neutral" | "success" | "alert" | "error";

interface StatusPanelProps {
  icon: IconName;
  tone?: StatusPanelTone;
  title: ReactNode;
  /** h1 when the panel is the whole page, h2 when it sits inside one. */
  headingLevel?: "h1" | "h2";
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function StatusPanel({
  icon,
  tone = "neutral",
  title,
  headingLevel: Heading = "h1",
  children,
  actions,
  className,
}: StatusPanelProps) {
  return (
    <div className={classNames(styles.panel, className)}>
      <span className={styles.tile} data-tone={tone} aria-hidden>
        <Icon name={icon} className={styles.icon} />
      </span>
      <Heading className={styles.title}>{title}</Heading>
      {children ? <div className={styles.body}>{children}</div> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
