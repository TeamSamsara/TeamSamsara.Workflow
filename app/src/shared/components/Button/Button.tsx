// File : /TeamSamsara.Workflow/app/src/shared/components/Button/Button.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The generic button. Handles the busy state (disabled, announced and showing a
// spinner) so a form cannot be submitted twice; every other behavior comes from the caller.

import type { ButtonHTMLAttributes } from "react";
import { ButtonContent } from "./ButtonContent";
import { buttonLook } from "./buttonLook";
import type { ButtonLookProps } from "./buttonTypes";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonLookProps {
  /** Shows the busy state: a spinner, disabled, and announced as busy. */
  isLoading?: boolean;
}

export function Button({
  type = "button",
  variant = "secondary",
  size = "medium",
  fullWidth = false,
  iconStart,
  iconEnd,
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      {...buttonLook(variant, size, fullWidth, className)}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      <ButtonContent
        iconStart={iconStart}
        iconEnd={iconEnd}
        isLoading={isLoading}
      >
        {children}
      </ButtonContent>
    </button>
  );
}
