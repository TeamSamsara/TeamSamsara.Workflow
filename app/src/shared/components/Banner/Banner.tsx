// File : /TeamSamsara.Workflow/app/src/shared/components/Banner/Banner.tsx
// Version : 1.1.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : A coloured box with an icon and a sentence or two, for something a person should
// know on this page (a link lasts 1 hour, a sign-in failed). Errors are announced right
// away; the other tones are read when the person reaches them.

import type { ReactNode } from "react";
import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import styles from "./Banner.module.css";

export type BannerTone = "info" | "success" | "alert" | "error";

const toneIcon: Record<BannerTone, IconName> = {
  info: "info",
  success: "check",
  alert: "warning",
  error: "error",
};

interface BannerProps {
  tone: BannerTone;
  /** Replaces the tone's usual icon. */
  icon?: IconName;
  children: ReactNode;
  /** A button at the end, e.g. to close it. */
  action?: ReactNode;
  className?: string;
}

export function Banner({
  tone,
  icon,
  children,
  action,
  className,
}: BannerProps) {
  return (
    <div
      className={classNames(styles.banner, className)}
      data-tone={tone}
      role={tone === "error" ? "alert" : undefined}
    >
      <Icon name={icon ?? toneIcon[tone]} className={styles.icon} />
      <div className={styles.text}>{children}</div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
