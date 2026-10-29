// File : /TeamSamsara.Workflow/app/src/shared/components/Card/CardHeader.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The top row of a card: its heading and an optional line under it on the left,
// and actions (a button, a count) on the right. Wraps on narrow screens.

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./Card.module.css";

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** h2 under a page title, h3 inside a section that already has one. */
  headingLevel?: "h2" | "h3";
  /** Id for the heading, so the card can point aria-labelledby at it. */
  titleId?: string;
  className?: string;
}

export function CardHeader({
  title,
  description,
  actions,
  headingLevel: Heading = "h2",
  titleId,
  className,
}: CardHeaderProps) {
  return (
    <header className={classNames(styles.header, className)}>
      <div className={styles.headerText}>
        <Heading id={titleId} className={styles.title}>
          {title}
        </Heading>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
