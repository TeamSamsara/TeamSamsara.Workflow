// File : /TeamSamsara.Workflow/app/src/shared/components/SegmentedControl/SegmentedControl.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A row of options where exactly one is picked (Month / Week / List, Light / Dark).
// Built from radio buttons, so arrow keys move between options and screen readers know it
// is one choice.

import { useId } from "react";
import { classNames } from "@/lib/classNames";
import styles from "./SegmentedControl.module.css";

export interface SegmentedOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface SegmentedControlProps<TValue extends string> {
  /** Names the group for screen readers (e.g. "View"). */
  label: string;
  options: readonly SegmentedOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<TValue extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps<TValue>) {
  const name = useId();

  return (
    <fieldset
      className={classNames(styles.group, className)}
      disabled={disabled}
    >
      <legend className={styles.legend}>{label}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className={styles.input}
          />
          <span className={styles.text}>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
