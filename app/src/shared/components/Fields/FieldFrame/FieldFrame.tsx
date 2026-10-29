// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/FieldFrame/FieldFrame.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The layout around every field: the label above, the control, then a hint and an
// error under it. It owns no state; the field passes the ids from useFieldIds.

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { FieldError } from "../FieldError/FieldError";
import type { FieldIds } from "./useFieldIds";
import styles from "./FieldFrame.module.css";

interface FieldFrameProps {
  ids: FieldIds;
  label: string;
  /** Hides the label on screen (for a search box or a table cell); screen readers still read it. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

export function FieldFrame({
  ids,
  label,
  hideLabel = false,
  hint,
  error,
  className,
  children,
}: FieldFrameProps) {
  return (
    <div className={classNames(styles.field, className)}>
      <label
        htmlFor={ids.inputId}
        className={hideLabel ? styles.hiddenLabel : styles.label}
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p id={ids.hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={ids.errorId} message={error} /> : null}
    </div>
  );
}
