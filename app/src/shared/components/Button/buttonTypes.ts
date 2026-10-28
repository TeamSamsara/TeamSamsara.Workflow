// File : /TeamSamsara.Workflow/app/src/shared/components/Button/buttonTypes.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : The looks and sizes every kind of button shares (Button, LinkButton, IconButton).

import type { IconName } from "@/shared/icons/iconRegistry";

/** primary: the one main action. secondary: outlined. ghost: text only. danger: removes or deletes. */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** small: inside cards and table rows. medium: the default. large: full-width form submits. */
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonLookProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean;
  /** Icon before the label. */
  iconStart?: IconName;
  /** Icon after the label. */
  iconEnd?: IconName;
}
