// File : /TeamSamsara.Workflow/app/src/features/auth/ui/AuthHeading.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The title and the line under it at the top of every sign-in form page.

import type { ReactNode } from "react";
import styles from "./AuthHeading.module.css";

interface AuthHeadingProps {
  title: string;
  description?: ReactNode;
}

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <header className={styles.heading}>
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}
