// File : /TeamSamsara.Workflow/app/src/views/auth/CheckInboxView.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The page after a reset link was sent: where to look, and a resend
// button that unlocks after a minute so the email isn't sent over and over.

import { useLocation } from "react-router-dom";
import { useRequestPasswordLink } from "@/features/auth";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths } from "@/shared/constants/routePaths";
import { formatCountdown, useCountdown } from "@/shared/hooks/useCountdown";
import { Icon } from "@/shared/icons/Icon";
import { readNavigationEmail } from "./authNavigationState";
import { CheckInboxViewText } from "./checkInboxViewContent";
import styles from "./AuthView.module.css";

const resendWaitSeconds = 60;

export function CheckInboxView() {
  const location = useLocation();
  const email = readNavigationEmail(location.state);
  const toast = useToast();
  const countdown = useCountdown(resendWaitSeconds, true);
  const { request, isSending, errorMessage } = useRequestPasswordLink(() => {
    countdown.start();
    toast.show({ tone: "success", title: CheckInboxViewText.resent });
  });

  const canResend = email !== "" && countdown.secondsLeft === 0;

  return (
    <div className={styles.view}>
      <StatusPanel
        icon="email"
        tone="success"
        title={CheckInboxViewText.title}
        actions={
          <>
            <LinkButton to={RoutePaths.signIn} variant="primary">
              {CheckInboxViewText.backToSignIn}
            </LinkButton>
            {email ? (
              <Button
                disabled={!canResend}
                isLoading={isSending}
                onClick={() => request(email)}
              >
                {countdown.secondsLeft > 0
                  ? CheckInboxViewText.resendIn(
                      formatCountdown(countdown.secondsLeft),
                    )
                  : CheckInboxViewText.resend}
              </Button>
            ) : null}
          </>
        }
      >
        <p>
          {email
            ? CheckInboxViewText.sentTo(email)
            : CheckInboxViewText.sentGeneric}
        </p>
        <ul className={styles.tips}>
          <li className={styles.tip}>
            <Icon name="check" className={styles.tipIcon} />
            {CheckInboxViewText.tipSpam}
          </li>
          <li className={styles.tip}>
            <Icon name="check" className={styles.tipIcon} />
            {CheckInboxViewText.tipLink}
          </li>
        </ul>
      </StatusPanel>
      {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}
    </div>
  );
}
