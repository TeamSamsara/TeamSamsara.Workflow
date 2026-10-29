// File : /TeamSamsara.Workflow/app/src/features/auth/validation/authValidation.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The checks each sign-in form runs before sending anything: what is
// missing or wrong, as the message to show under the field.

import { isEmailAddress } from "@/shared/validation/emailFormat";
import { meetsPasswordRules } from "@/shared/validation/passwordRules";
import { ValidationText } from "@/shared/validation/validationContent";

export type FieldErrors<TField extends string> = Partial<
  Record<TField, string>
>;

export function hasFieldErrors<TField extends string>(
  errors: FieldErrors<TField>,
): boolean {
  return Object.values(errors).some(Boolean);
}

export function checkEmail(email: string): string | undefined {
  if (!email.trim()) return ValidationText.emailRequired;
  if (!isEmailAddress(email)) return ValidationText.emailInvalid;
  return undefined;
}

export interface SignInValues {
  email: string;
  password: string;
}

export function checkSignIn(
  values: SignInValues,
): FieldErrors<keyof SignInValues> {
  return {
    email: checkEmail(values.email),
    password: values.password ? undefined : ValidationText.passwordRequired,
  };
}

export interface NewPasswordValues {
  password: string;
  confirmation: string;
}

export function checkNewPassword(
  values: NewPasswordValues,
): FieldErrors<keyof NewPasswordValues> {
  return {
    password: meetsPasswordRules(values.password)
      ? undefined
      : ValidationText.passwordTooWeak,
    confirmation:
      values.confirmation === values.password
        ? undefined
        : ValidationText.passwordsDontMatch,
  };
}
