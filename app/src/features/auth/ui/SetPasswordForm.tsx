// File : /TeamSamsara.Workflow/app/src/features/auth/ui/SetPasswordForm.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Choosing a password from an email link: the address it was sent to
// (read-only), the new password twice, and the live rule checklist. Saving signs
// the person in.

import { useState, type FormEvent } from "react";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { PasswordField } from "@/shared/components/Fields/PasswordField/PasswordField";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useSetPassword } from "../hooks/useSetPassword";
import { checkNewPassword, hasFieldErrors } from "../validation/authValidation";
import { PasswordRules } from "./PasswordRules";
import { SetPasswordFormText } from "./setPasswordFormContent";
import styles from "./AuthForm.module.css";

interface SetPasswordFormProps {
  code: string;
  email: string;
  onDone: () => void;
  onExpired: () => void;
}

export function SetPasswordForm({
  code,
  email,
  onDone,
  onExpired,
}: SetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [triedToSend, setTriedToSend] = useState(false);
  const { submit, isSaving, errorMessage } = useSetPassword({
    onDone,
    onExpired,
  });

  const errors = triedToSend
    ? checkNewPassword({ password, confirmation })
    : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriedToSend(true);
    if (hasFieldErrors(checkNewPassword({ password, confirmation }))) return;
    submit({ code, email, password });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}
      {/* Lets password managers save the new password under the right account. */}
      <TextField
        label={SetPasswordFormText.email}
        type="email"
        autoComplete="username"
        value={email}
        readOnly
        hint={SetPasswordFormText.emailHint}
      />
      <PasswordField
        label={SetPasswordFormText.newPassword}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />
      <PasswordField
        label={SetPasswordFormText.confirmation}
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        error={errors.confirmation}
      />
      <PasswordRules password={password} confirmation={confirmation} />
      <Button
        type="submit"
        variant="primary"
        size="large"
        fullWidth
        isLoading={isSaving}
      >
        {SetPasswordFormText.submit}
      </Button>
    </form>
  );
}
