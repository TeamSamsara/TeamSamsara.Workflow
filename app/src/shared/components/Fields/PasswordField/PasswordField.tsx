// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/PasswordField/PasswordField.tsx
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : A TextField for passwords with a button that shows or hides what was typed.
// Each field keeps its own show/hide state.

import { useState } from "react";
import { Icon } from "@/shared/icons/Icon";
import { TextField, type TextFieldProps } from "../TextField/TextField";
import { PasswordFieldText } from "./passwordFieldContent";
import styles from "./PasswordField.module.css";

type PasswordFieldProps = Omit<
  TextFieldProps,
  "type" | "trailing" | "leadingIcon"
>;

export function PasswordField(props: PasswordFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <TextField
      {...props}
      type={isRevealed ? "text" : "password"}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-label={PasswordFieldText.showPassword}
          aria-pressed={isRevealed}
          disabled={props.disabled}
          onClick={() => setIsRevealed((current) => !current)}
        >
          <Icon name={isRevealed ? "hidePassword" : "showPassword"} />
        </button>
      }
    />
  );
}
