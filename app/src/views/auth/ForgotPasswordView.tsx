// File : /TeamSamsara.Workflow/app/src/views/auth/ForgotPasswordView.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The forgot-password page. Starts with the email typed on the sign-in
// page, and moves on to Check your inbox once the link is sent.

import { useLocation, useNavigate } from "react-router-dom";
import { AuthHeading, ForgotPasswordForm } from "@/features/auth";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { RoutePaths } from "@/shared/constants/routePaths";
import {
  readNavigationEmail,
  type EmailNavigationState,
} from "./authNavigationState";
import { ForgotPasswordViewText } from "./forgotPasswordViewContent";
import styles from "./AuthView.module.css";

export function ForgotPasswordView() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleSent(email: string) {
    const state: EmailNavigationState = { email };
    navigate(RoutePaths.checkInbox, { state });
  }

  return (
    <div className={styles.view}>
      <LinkButton
        to={RoutePaths.signIn}
        variant="ghost"
        iconStart="back"
        className={styles.backLink}
      >
        {ForgotPasswordViewText.back}
      </LinkButton>
      <AuthHeading
        title={ForgotPasswordViewText.title}
        description={ForgotPasswordViewText.description}
      />
      <ForgotPasswordForm
        defaultEmail={readNavigationEmail(location.state)}
        onSent={handleSent}
      />
    </div>
  );
}
