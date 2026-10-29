// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/FieldError/FieldError.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The error message of a field: an icon and the text, announced to screen readers.
// The field passes the id its input points to.

import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import styles from "./FieldError.module.css";

interface FieldErrorProps {
  id: string;
  message: string;
  className?: string;
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <p id={id} className={classNames(styles.error, className)} role="alert">
      <Icon name="error" className={styles.icon} />
      <span className={styles.text}>{message}</span>
    </p>
  );
}
