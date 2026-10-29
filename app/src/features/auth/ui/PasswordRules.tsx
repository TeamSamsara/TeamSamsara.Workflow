// File : /TeamSamsara.Workflow/app/src/features/auth/ui/PasswordRules.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The checklist under a new password: each rule turns green with a tick
// as soon as the typed password meets it, and so does "Both passwords match".

import { VisuallyHidden } from "@/shared/components/VisuallyHidden/VisuallyHidden";
import { Icon } from "@/shared/icons/Icon";
import {
  checkPasswordRules,
  minimumPasswordLength,
  type PasswordRule,
} from "@/shared/validation/passwordRules";
import { PasswordRuleText } from "@/shared/validation/validationContent";
import { PasswordRulesText } from "./passwordRulesContent";
import styles from "./PasswordRules.module.css";

interface PasswordRulesProps {
  password: string;
  confirmation: string;
}

const ruleLabels: Record<PasswordRule, string> = {
  minimumLength: PasswordRuleText.minimumLength(minimumPasswordLength),
  numberOrSymbol: PasswordRuleText.numberOrSymbol,
};

export function PasswordRules({ password, confirmation }: PasswordRulesProps) {
  const items = [
    ...checkPasswordRules(password).map((result) => ({
      key: result.rule,
      label: ruleLabels[result.rule],
      met: result.met,
    })),
    {
      key: "matches",
      label: PasswordRuleText.matches,
      met: confirmation.length > 0 && confirmation === password,
    },
  ];

  return (
    <ul className={styles.list} aria-label={PasswordRulesText.listLabel}>
      {items.map((item) => (
        <li key={item.key} className={styles.item} data-met={item.met}>
          <Icon name={item.met ? "check" : "close"} className={styles.icon} />
          <span>{item.label}</span>
          <VisuallyHidden>
            {item.met ? PasswordRulesText.met : PasswordRulesText.notMet}
          </VisuallyHidden>
        </li>
      ))}
    </ul>
  );
}
