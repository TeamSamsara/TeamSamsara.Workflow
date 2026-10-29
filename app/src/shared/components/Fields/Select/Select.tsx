// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/Select/Select.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A choice from a list, built on the browser's own select so the keyboard, screen
// readers and phones all work as people expect. Looks like TextField, with a chevron.

import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/shared/icons/Icon";
import { FieldFrame } from "../FieldFrame/FieldFrame";
import { useFieldIds } from "../FieldFrame/useFieldIds";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<ComponentProps<"select">, "children"> {
  label: string;
  hideLabel?: boolean;
  options: readonly SelectOption[];
  /** A first, empty choice that asks the person to pick (e.g. "Choose a group"). */
  placeholder?: string;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
}

export function Select({
  label,
  hideLabel,
  options,
  placeholder,
  hint,
  error,
  id,
  className,
  disabled,
  ...rest
}: SelectProps) {
  const hasError = Boolean(error);
  const ids = useFieldIds(id, Boolean(hint), hasError);

  return (
    <FieldFrame
      ids={ids}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      className={className}
    >
      <div
        className={styles.control}
        data-invalid={hasError}
        data-disabled={Boolean(disabled)}
      >
        <select
          {...rest}
          id={ids.inputId}
          disabled={disabled}
          className={styles.input}
          aria-invalid={hasError || undefined}
          aria-describedby={ids.describedBy}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" className={styles.chevron} />
      </div>
    </FieldFrame>
  );
}
