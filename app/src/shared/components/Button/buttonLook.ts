// File : /TeamSamsara.Workflow/app/src/shared/components/Button/buttonLook.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Turns the look props into the class and data attributes a button element needs,
// so a <button> and a router link look exactly the same.

import { classNames } from "@/lib/classNames";
import type { ButtonSize, ButtonVariant } from "./buttonTypes";
import styles from "./Button.module.css";

interface ButtonLook {
  className: string;
  "data-variant": ButtonVariant;
  "data-size": ButtonSize;
}

export function buttonLook(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): ButtonLook {
  return {
    className: classNames(
      styles.button,
      fullWidth && styles.fullWidth,
      className,
    ),
    "data-variant": variant,
    "data-size": size,
  };
}
