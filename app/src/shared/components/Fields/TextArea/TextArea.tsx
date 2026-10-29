// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/TextArea/TextArea.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The generic multi-line input. Looks like TextField and ties its label, hint and
// error to the field for screen readers. A footer row under the box can hold a counter or a
// copy button.

import type { ComponentProps, ReactNode } from "react";
import { FieldFrame } from "../FieldFrame/FieldFrame";
import { useFieldIds } from "../FieldFrame/useFieldIds";
import styles from "./TextArea.module.css";

export interface TextAreaProps extends Omit<
  ComponentProps<"textarea">,
  "children"
> {
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string | null;
  /** A row under the box, for a character count or an action. */
  footer?: ReactNode;
  className?: string;
}

export function TextArea({
  label,
  hideLabel,
  hint,
  error,
  footer,
  id,
  className,
  disabled,
  rows = 4,
  ...rest
}: TextAreaProps) {
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
        <textarea
          {...rest}
          id={ids.inputId}
          rows={rows}
          disabled={disabled}
          className={styles.input}
          aria-invalid={hasError || undefined}
          aria-describedby={ids.describedBy}
        />
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </FieldFrame>
  );
}
