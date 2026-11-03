// File : /TeamSamsara.Workflow/app/src/shared/components/PageHeader/PageHeader.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The top of every page: an optional breadcrumb trail, the page title (the one h1),
// a line or two under it, and the page's main actions on the right.

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { Breadcrumbs, type BreadcrumbStep } from "../Breadcrumbs/Breadcrumbs";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: ReactNode;
  /** A line under the title: what the page is for, or the item's status and date. */
  description?: ReactNode;
  breadcrumbs?: readonly BreadcrumbStep[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={classNames(styles.header, className)}>
      <div className={styles.text}>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumbs steps={breadcrumbs} />
        ) : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? (
          <div className={styles.description}>{description}</div>
        ) : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
