// File : /TeamSamsara.Workflow/app/src/shared/components/Spinner/Spinner.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A turning circle that says something is loading. With a label it is announced;
// inside a busy button it is decorative, because the button already says it is busy.

import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import { SpinnerText } from "./spinnerContent";
import styles from "./Spinner.module.css";

interface SpinnerProps {
  /** What is loading, for screen readers. Set to null when something else announces it. */
  label?: string | null;
  className?: string;
}

export function Spinner({
  label = SpinnerText.loading,
  className,
}: SpinnerProps) {
  return (
    <span
      className={classNames(styles.spinner, className)}
      role={label ? "status" : undefined}
    >
      <Icon name="loading" className={styles.icon} />
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
}
