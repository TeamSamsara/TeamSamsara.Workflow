// File : /TeamSamsara.Workflow/app/src/features/auth/ui/SignInForm.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Email, password and Sign in. Field problems show once the person has
// tried to send; a refused sign-in shows above the fields without saying whether
// the email or the password was wrong.

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { PasswordField } from "@/shared/components/Fields/PasswordField/PasswordField";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useSignIn } from "../hooks/useSignIn";
import { checkSignIn, hasFieldErrors } from "../validation/authValidation";
import { SignInFormText } from "./signInFormContent";
import styles from "./AuthForm.module.css";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [triedToSend, setTriedToSend] = useState(false);
  const { submit, isSubmitting, errorMessage } = useSignIn();

  const errors = triedToSend ? checkSignIn({ email, password }) : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriedToSend(true);
    if (hasFieldErrors(checkSignIn({ email, password }))) return;
    submit({ email, password });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}
      <TextField
        label={SignInFormText.email}
        type="email"
        autoComplete="email"
        placeholder={SignInFormText.emailPlaceholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <PasswordField
        label={SignInFormText.password}
        autoComplete="current-password"
        placeholder={SignInFormText.passwordPlaceholder}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />
      <Link
        to={RoutePaths.forgotPassword}
        state={{ email }}
        className={styles.inlineLink}
      >
        {SignInFormText.forgotPassword}
      </Link>
      <Button
        type="submit"
        variant="primary"
        size="large"
        fullWidth
        isLoading={isSubmitting}
      >
        {SignInFormText.submit}
      </Button>
    </form>
  );
}
