// File : /TeamSamsara.Workflow/app/src/shared/components/Breadcrumbs/Breadcrumbs.tsx
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : The trail above a page title ("Calendar / Match day / Results post"). Every step
// with a link goes back up; the last one is the current page.

import { Fragment } from "react";
import { Link } from "react-router-dom";
import { classNames } from "@/lib/classNames";
import { BreadcrumbsText } from "./breadcrumbsContent";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbStep {
  label: string;
  /** Where the step goes. The current page has none. */
  to?: string;
}

interface BreadcrumbsProps {
  steps: readonly BreadcrumbStep[];
  className?: string;
}

export function Breadcrumbs({ steps, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label={BreadcrumbsText.label}
      className={classNames(styles.breadcrumbs, className)}
    >
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const isCurrent = index === steps.length - 1;
          return (
            <Fragment key={`${step.label}-${index}`}>
              <li>
                {step.to && !isCurrent ? (
                  <Link to={step.to} className={styles.link}>
                    {step.label}
                  </Link>
                ) : (
                  <span aria-current={isCurrent ? "page" : undefined}>
                    {step.label}
                  </span>
                )}
              </li>
              {isCurrent ? null : <li aria-hidden>/</li>}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
