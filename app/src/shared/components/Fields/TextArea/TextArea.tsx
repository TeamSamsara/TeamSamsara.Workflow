// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/TextArea/TextArea.tsx
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : The generic multi-line input. Looks like TextField and ties its label, hint and
// error to the field for screen readers. It grows with its text (no drag handle) and shows a
// character count near its limit. A footer row under the box can hold more, like a copy button.

import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { FieldFrame } from "../FieldFrame/FieldFrame";
import { useFieldIds } from "../FieldFrame/useFieldIds";
import styles from "./TextArea.module.css";

/** The counter shows once the text fills this share of maxLength. */
const countFromShare = 0.8;

export interface TextAreaProps extends Omit<
  ComponentProps<"textarea">,
  "children"
> {
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  /** A longer explanation behind a "?" beside the label. */
  help?: ReactNode;
  error?: string | null;
  /** A row under the box, for a character count or an action. */
  footer?: ReactNode;
  /** Shows "120 / 300" once the text gets close to maxLength. */
  showCount?: boolean;
  className?: string;
}

export function TextArea({
  label,
  hideLabel,
  hint,
  help,
  error,
  footer,
  showCount = true,
  id,
  className,
  disabled,
  rows = 3,
  value,
  maxLength,
  onInput,
  ...rest
}: TextAreaProps) {
  const box = useRef<HTMLTextAreaElement>(null);

  // The box grows with its text instead of being dragged bigger.
  function fitHeight() {
    const element = box.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`;
  }
  useLayoutEffect(fitHeight, [value]);

  const length = typeof value === "string" ? value.length : 0;
  const nearLimit =
    showCount &&
    maxLength !== undefined &&
    length >= maxLength * countFromShare;
  const counter = nearLimit ? (
    <span className={styles.count} data-full={length >= (maxLength ?? 0)}>
      {length} / {maxLength}
    </span>
  ) : null;
  const footerRow =
    footer || counter ? (
      <div className={styles.footer}>
        {footer}
        {counter}
      </div>
    ) : null;

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
        <textarea
          {...rest}
          id={ids.inputId}
          ref={box}
          rows={rows}
          value={value}
          maxLength={maxLength}
          onInput={(event) => {
            fitHeight();
            onInput?.(event);
          }}
          disabled={disabled}
          className={styles.input}
          aria-invalid={hasError || undefined}
          aria-describedby={ids.describedBy}
        />
      </div>
      {footerRow}
    </FieldFrame>
  );
}
