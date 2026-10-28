// File : /TeamSamsara.Workflow/app/src/shared/components/Pill/Pill.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A small rounded label for a state (a task status, a member status). The words
// come from the data; the caller picks the tone that fits what the state means.

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./Pill.module.css";

/** neutral: outlined. muted: outlined, grey text. The rest are filled. */
export type PillTone =
  "neutral" | "muted" | "success" | "alert" | "error" | "info";

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone = "neutral", children, className }: PillProps) {
  return (
    <span className={classNames(styles.pill, className)} data-tone={tone}>
      {children}
    </span>
  );
}
