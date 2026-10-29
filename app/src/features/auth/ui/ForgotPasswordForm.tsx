// File : /TeamSamsara.Workflow/app/src/features/auth/ui/ForgotPasswordForm.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The email to send a reset link to. Calls onSent once the link is on
// its way (or would be, for an email with no account).

import { useState, type FormEvent } from "react";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useRequestPasswordLink } from "../hooks/useRequestPasswordLink";
import { checkEmail } from "../validation/authValidation";
import { ForgotPasswordFormText } from "./forgotPasswordFormContent";
import styles from "./AuthForm.module.css";

interface ForgotPasswordFormProps {
  /** Filled in when the person came from the sign-in form with an email typed. */
  defaultEmail?: string;
  onSent: (email: string) => void;
}

export function ForgotPasswordForm({
  defaultEmail = "",
  onSent,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [triedToSend, setTriedToSend] = useState(false);
  const { request, isSending, errorMessage } = useRequestPasswordLink(onSent);

  const emailError = triedToSend ? checkEmail(email) : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriedToSend(true);
    if (checkEmail(email)) return;
    request(email.trim());
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}
      <TextField
        label={ForgotPasswordFormText.email}
        type="email"
        autoComplete="email"
        placeholder={ForgotPasswordFormText.emailPlaceholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={emailError}
      />
      <Button
        type="submit"
        variant="primary"
        size="large"
        fullWidth
        isLoading={isSending}
      >
        {ForgotPasswordFormText.submit}
      </Button>
      <p className={styles.note}>{ForgotPasswordFormText.privacyNote}</p>
    </form>
  );
}
