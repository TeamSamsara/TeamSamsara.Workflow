// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/TextField/TextField.tsx
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : The generic single-line input, with its label, hint and error tied to it for
// screen readers. An icon can sit at the start and any content (a button) at the end. What
// is validated and when is decided by the caller.

import type { ComponentProps, ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import { FieldFrame } from "../FieldFrame/FieldFrame";
import { useFieldIds } from "../FieldFrame/useFieldIds";
import styles from "./TextField.module.css";

export interface TextFieldProps extends Omit<
  ComponentProps<"input">,
  "children"
> {
  label: string;
  hideLabel?: boolean;
  /** Help under the field, always shown. */
  hint?: ReactNode;
  /** A longer explanation behind a "?" beside the label. */
  help?: ReactNode;
  /** The message under the field. Leave empty when the value is fine. */
  error?: string | null;
  /** Icon inside the start of the box, like the magnifier of a search field. */
  leadingIcon?: IconName;
  /** Content inside the end of the box (a button, an icon). */
  trailing?: ReactNode;
  /** Class for the outer wrapper, to size the field inside a row. */
  className?: string;
}

export function TextField({
  label,
  hideLabel,
  hint,
  help,
  error,
  leadingIcon,
  trailing,
  id,
  className,
  disabled,
  ...rest
}: TextFieldProps) {
  const hasError = Boolean(error);
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
        {leadingIcon ? (
          <Icon name={leadingIcon} className={styles.leadingIcon} />
        ) : null}
        <input
          {...rest}
          id={ids.inputId}
          disabled={disabled}
          className={classNames(
            styles.input,
            leadingIcon && styles.withLeading,
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={ids.describedBy}
        />
        {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
      </div>
    </FieldFrame>
  );
}
