// File : /TeamSamsara.Workflow/app/src/shared/components/StepProgress/StepProgress.tsx
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : Where someone is in a few-step flow: "Step 2 of 5", the step's
// name, and a bar of segments filled up to the current one.

import { StepProgressText } from "./stepProgressContent";
import styles from "./StepProgress.module.css";

interface StepProgressProps {
  /** 0-based. */
  current: number;
  total: number;
  /** The current step's name. */
  label?: string;
}

export function StepProgress({ current, total, label }: StepProgressProps) {
  return (
    <div className={styles.progress}>
      <p className={styles.text}>
        <span className={styles.count}>
          {StepProgressText.step(current + 1, total)}
        </span>
        {label ? <span className={styles.label}>{label}</span> : null}
      </p>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-label={StepProgressText.step(current + 1, total)}
      >
        {Array.from({ length: total }, (_unused, index) => (
          <span
            key={index}
            className={styles.segment}
            data-done={index <= current}
          />
        ))}
      </div>
    </div>
  );
}
