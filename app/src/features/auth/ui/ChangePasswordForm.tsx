// File : /TeamSamsara.Workflow/app/src/features/auth/ui/ChangePasswordForm.tsx
// Version : 1.0.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : Changing your password while signed in: the current one, the new
// one twice, the live rule checklist. Forgot the current one? A link emails
// them a way to choose a new one.

import { useState, type FormEvent } from "react";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { PasswordField } from "@/shared/components/Fields/PasswordField/PasswordField";
import { useChangePassword } from "../hooks/useChangePassword";
import { checkNewPassword, hasFieldErrors } from "../validation/authValidation";
import { ChangePasswordText as Text } from "./changePasswordContent";
import { PasswordRules } from "./PasswordRules";
import styles from "./ChangePasswordForm.module.css";

interface ChangePasswordFormProps {
  email: string;
  onChanged: () => void;
}

export function ChangePasswordForm({
  email,
  onChanged,
}: ChangePasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [tried, setTried] = useState(false);
  const change = useChangePassword(() => {
    setCurrent("");
    setPassword("");
    setConfirmation("");
    setTried(false);
    onChanged();
  });
  const errors = tried ? checkNewPassword({ password, confirmation }) : {};
  const currentMissing = tried && !current ? Text.currentRequired : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (
      !current ||
      hasFieldErrors(checkNewPassword({ password, confirmation }))
    )
      return;
    change.submit({ current, password });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {change.errorMessage ? (
        <Banner tone="error">{change.errorMessage}</Banner>
      ) : null}
      {/* Lets password managers update the saved password for this account. */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
      />
      <div className={styles.fields}>
        <PasswordField
          label={Text.current}
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          error={currentMissing}
        />
        <PasswordField
          label={Text.newPassword}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <PasswordField
          label={Text.confirmation}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={errors.confirmation}
        />
      </div>
      {password ? (
        <PasswordRules password={password} confirmation={confirmation} />
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" isLoading={change.isSaving}>
          {Text.submit}
        </Button>
        <span className={styles.reset}>
          {change.resetSent ? (
            Text.resetSent(email)
          ) : (
            <>
              {Text.forgot}{" "}
              <button
                type="button"
                className={styles.link}
                onClick={() => change.sendReset(email)}
                disabled={change.isSendingReset}
              >
                {Text.sendReset}
              </button>
            </>
          )}
        </span>
      </div>
      {change.resetError ? (
        <Banner tone="error">{change.resetError}</Banner>
      ) : null}
    </form>
  );
}
