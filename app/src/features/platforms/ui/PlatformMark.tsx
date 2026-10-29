// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/PlatformMark.tsx
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : A platform's logo, white on its brand colour in a small rounded tile.

import type { CSSProperties } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import type { Platform } from "../catalogue/platformTypes";
import styles from "./PlatformMark.module.css";

interface PlatformMarkProps {
  platform: Platform;
  size?: "small" | "medium";
  className?: string;
}

export function PlatformMark({
  platform,
  size = "medium",
  className,
}: PlatformMarkProps) {
  return (
    <span
      className={classNames(styles.mark, className)}
      data-size={size}
      style={{ "--platform-color": platform.color } as CSSProperties}
      aria-hidden="true"
    >
      <Icon name={platform.icon} />
    </span>
  );
}
