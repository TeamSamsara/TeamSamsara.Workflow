// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/Select/Select.tsx
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
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
  /** Options with the same group are listed together under that heading. */
  group?: string;
}

function OptionList({ options }: { options: readonly SelectOption[] }) {
  return options.map((option) => (
    <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  ));
}

/** Ungrouped options first, then each group in the order it first appears. */
function groupOptions(options: readonly SelectOption[]) {
  const loose = options.filter((option) => !option.group);
  const groups = new Map<string, SelectOption[]>();
  for (const option of options) {
    if (option.group)
      groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
  }
  return { loose, groups: [...groups] };
}

interface SelectProps extends Omit<ComponentProps<"select">, "children"> {
  label: string;
  hideLabel?: boolean;
  options: readonly SelectOption[];
  /** A first, empty choice that asks the person to pick (e.g. "Choose a group"). */
  placeholder?: string;
  hint?: ReactNode;
  /** A longer explanation behind a "?" beside the label. */
  help?: ReactNode;
  error?: string | null;
  className?: string;
}

export function Select({
  label,
  hideLabel,
  options,
  placeholder,
  hint,
  help,
  error,
  id,
  className,
  disabled,
  ...rest
}: SelectProps) {
  const hasError = Boolean(error);
  const grouped = groupOptions(options);
  const ids = useFieldIds(id, Boolean(hint), hasError);

  return (
    <FieldFrame
      ids={ids}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      help={help}
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
          <OptionList options={grouped.loose} />
          {grouped.groups.map(([group, groupOptionsList]) => (
            <optgroup key={group} label={group}>
              <OptionList options={groupOptionsList} />
            </optgroup>
          ))}
        </select>
        <Icon name="chevronDown" className={styles.chevron} />
      </div>
    </FieldFrame>
  );
}
