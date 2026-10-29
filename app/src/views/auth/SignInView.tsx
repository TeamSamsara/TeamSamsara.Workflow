// File : /TeamSamsara.Workflow/app/src/views/auth/SignInView.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The sign-in page. Once signed in, the session sends the person on to
// the page they wanted, or the calendar.

import { AuthHeading, SignInForm } from "@/features/auth";
import { SignInViewText } from "./signInViewContent";
import styles from "./AuthView.module.css";

export function SignInView() {
  return (
    <div className={styles.view}>
      <AuthHeading
        title={SignInViewText.title}
        description={SignInViewText.description}
      />
      <SignInForm />
      <hr className={styles.divider} />
      <p className={styles.note}>{SignInViewText.inviteOnly}</p>
    </div>
  );
}
