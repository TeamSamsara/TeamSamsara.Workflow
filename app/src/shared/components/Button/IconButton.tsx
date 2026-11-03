// File : /TeamSamsara.Workflow/app/src/shared/components/Button/IconButton.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A square button that shows only an icon. The label is required, because it is
// the only thing a screen reader can say about the button.

import type { ButtonHTMLAttributes } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import { buttonLook } from "./buttonLook";
import type { ButtonSize, ButtonVariant } from "./buttonTypes";
import styles from "./Button.module.css";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: IconName;
  /** Read by screen readers and shown as the tooltip. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function IconButton({
  icon,
  label,
  type = "button",
  variant = "secondary",
  size = "medium",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      {...buttonLook(
        variant,
        size,
        false,
        classNames(styles.iconOnly, className),
      )}
      type={type}
      aria-label={label}
      title={rest.title ?? label}
    >
      <Icon name={icon} />
    </button>
  );
}
