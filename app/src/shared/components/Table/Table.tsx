// File : /TeamSamsara.Workflow/app/src/shared/components/Table/Table.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A styled table that scrolls sideways on small screens instead of squashing its
// columns. The page writes the rows with plain thead, tr, th and td.

import type { CSSProperties, ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./Table.module.css";

interface TableProps {
  /** What the table lists, for screen readers (e.g. "Members"). */
  caption: string;
  /** Narrowest the table gets before it scrolls sideways, in pixels. */
  minWidth?: number;
  children: ReactNode;
  className?: string;
}

const defaultMinWidth = 640;

export function Table({
  caption,
  minWidth = defaultMinWidth,
  children,
  className,
}: TableProps) {
  const widthStyle = { "--table-min-width": `${minWidth}px` } as CSSProperties;

  return (
    <div className={classNames(styles.scroller, className)} style={widthStyle}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}
