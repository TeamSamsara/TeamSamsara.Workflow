// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/Checkbox/Checkbox.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A checkbox with its label and an optional line of description. It is the
// browser's own checkbox, restyled, so clicking the label and the keyboard work as usual.

import { useId, type ComponentProps, type ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends Omit<
  ComponentProps<"input">,
  "type" | "children"
> {
  label: ReactNode;
  /** Hides the label on screen (a row checkbox in a table); screen readers still read it. */
  hideLabel?: boolean;
  description?: ReactNode;
  className?: string;
}

export function Checkbox({
  label,
  hideLabel = false,
  description,
  id,
  className,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  return (
    <div className={classNames(styles.root, className)}>
      <span className={styles.box}>
        <input
          {...rest}
          id={inputId}
          type="checkbox"
          className={styles.input}
          aria-describedby={description ? descriptionId : undefined}
        />
        <Icon name="check" className={styles.mark} strokeWidth={3} />
      </span>
      <span className={hideLabel ? styles.hiddenText : styles.text}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {description ? (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
}
