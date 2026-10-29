// File : /TeamSamsara.Workflow/app/src/app/layouts/AuthLayout/AuthLayout.tsx
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The frame around the sign-in pages: a dark brand panel with the
// slogan, and a centred column for the form, with the theme toggle above it.
// On phones the panel sits above the form.

import { Outlet, useMatches } from "react-router-dom";
import { ThemeToggle } from "@/core/theme";
import { Branding } from "@/shared/constants/branding";
import { AuthLayoutText } from "./authLayoutContent";
import styles from "./AuthLayout.module.css";

/** Set as a route's handle to give its page the wider column (setup's two-field rows). */
export interface AuthLayoutHandle {
  wideContent?: boolean;
}

function isWideHandle(handle: unknown): boolean {
  return (
    typeof handle === "object" &&
    handle !== null &&
    (handle as AuthLayoutHandle).wideContent === true
  );
}

export function AuthLayout() {
  const isWide = useMatches().some((match) => isWideHandle(match.handle));

  return (
    <div className={styles.layout}>
      <aside className={styles.panel}>
        <div className={styles.brand}>
          <img src={Branding.logoSrc} alt="" className={styles.logo} />
          <span className={styles.appName}>{Branding.appName}</span>
        </div>
        <div className={styles.pitch}>
          <p className={styles.slogan}>
            {AuthLayoutText.sloganLines.map((line) => (
              <span key={line} className={styles.sloganLine}>
                {line}
              </span>
            ))}
          </p>
          <p className={styles.tagline}>{AuthLayoutText.tagline}</p>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <ThemeToggle />
        </div>
        <div className={styles.content} data-wide={isWide}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
