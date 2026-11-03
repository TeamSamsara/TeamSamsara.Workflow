// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/Switch/Switch.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : An on/off switch with its label and description on the left, like the permission
// rows. It changes right away, so it is for settings that apply as soon as they flip.

import { useId, type ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./Switch.module.css";

interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const labelId = `${switchId}-label`;
  const descriptionId = `${switchId}-description`;

  return (
    <div className={classNames(styles.row, className)}>
      <span className={styles.text}>
        <label id={labelId} htmlFor={switchId} className={styles.label}>
          {label}
        </label>
        {description ? (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        ) : null}
      </span>
      <button
        id={switchId}
        type="button"
        role="switch"
        className={styles.switch}
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
    </div>
  );
}
