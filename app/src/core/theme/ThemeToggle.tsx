// File : /TeamSamsara.Workflow/app/src/core/theme/ThemeToggle.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The sun/moon button that flips between light and dark. It shows the
// theme you would switch to. Following the device again is picked on the
// account page.

import { classNames } from "@/lib/classNames";
import { Icon } from "@/shared/icons/Icon";
import { useTheme } from "./useTheme";
import { ThemeToggleText } from "./themeToggleContent";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  /** nav: on the dark sidebar or sign-in panel. page: on the page background. */
  surface?: "nav" | "page";
  className?: string;
}

export function ThemeToggle({ surface = "page", className }: ThemeToggleProps) {
  const { resolved, setChoice } = useTheme();
  const isDark = resolved === "dark";
  const label = isDark
    ? ThemeToggleText.switchToLight
    : ThemeToggleText.switchToDark;

  return (
    <button
      type="button"
      className={classNames(styles.toggle, className)}
      data-surface={surface}
      aria-label={label}
      title={label}
      onClick={() => setChoice(isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "themeLight" : "themeDark"} />
    </button>
  );
}
