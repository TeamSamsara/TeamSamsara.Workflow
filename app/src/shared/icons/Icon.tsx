// File : /TeamSamsara.Workflow/app/src/shared/icons/Icon.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Draws one icon from the registry by name, as a decorative image.

import { classNames } from "@/lib/classNames";
import { iconRegistry, type IconName } from "./iconRegistry";
import styles from "./Icon.module.css";

interface IconComponentProps {
  name: IconName;
  className?: string;
  /** A thicker or thinner line for the interface icons. Brand logos ignore it. */
  strokeWidth?: number;
}

export function Icon({ name, className, strokeWidth }: IconComponentProps) {
  const Glyph = iconRegistry[name];

  return (
    <Glyph
      className={classNames(styles.icon, className)}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
