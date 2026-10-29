// File : /TeamSamsara.Workflow/app/src/app/layouts/AuthLayout/AuthLayout.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The frame around the sign-in pages: a dark brand panel with the
// slogan, and a centred column for the form, with the theme toggle above it.
// On phones the panel sits above the form.

import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/core/theme";
import { Branding } from "@/shared/constants/branding";
import { AuthLayoutText } from "./authLayoutContent";
import styles from "./AuthLayout.module.css";

export function AuthLayout() {
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
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
