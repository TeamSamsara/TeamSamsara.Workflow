// File : /TeamSamsara.Workflow/app/src/views/auth/SignInView.tsx
// Version : 1.1.0
// Latest commit: feature/remember-me
// Author : Gerrah
// Purpose : The sign-in page. Once signed in, the session sends the person on to
// the page they wanted, or the calendar. After a sign-in ran past the
// workspace's limit, it says so.

import { useState } from "react";
import { takeSessionEndedNotice } from "@/core/session";
import { AuthHeading, SignInForm } from "@/features/auth";
import { Banner } from "@/shared/components/Banner/Banner";
import { SignInViewText } from "./signInViewContent";
import styles from "./AuthView.module.css";

export function SignInView() {
  const [ended] = useState(takeSessionEndedNotice);
  return (
    <div className={styles.view}>
      <AuthHeading
        title={SignInViewText.title}
        description={SignInViewText.description}
      />
      {ended ? (
        <Banner tone="info">{SignInViewText.sessionEnded}</Banner>
      ) : null}
      <SignInForm />
      <hr className={styles.divider} />
      <p className={styles.note}>{SignInViewText.inviteOnly}</p>
    </div>
  );
}
