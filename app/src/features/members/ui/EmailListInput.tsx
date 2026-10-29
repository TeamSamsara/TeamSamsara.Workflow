// File : /TeamSamsara.Workflow/app/src/features/members/ui/EmailListInput.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A field that collects emails as chips. Typing a comma, space or
// Enter (or leaving the field) turns what was typed into chips; pasting a list
// adds them all. Anything that isn't an email stays in the box to be fixed.
// Backspace in an empty box removes the last chip.

import {
  useId,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Icon } from "@/shared/icons/Icon";
import { addEmails } from "../service/emailList";
import { EmailListInputText } from "./membersContent";
import styles from "./EmailListInput.module.css";

interface EmailListInputProps {
  emails: readonly string[];
  onChange: (emails: string[]) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
}

const commitKeys = new Set(["Enter", ",", ";", " ", "Tab"]);

export function EmailListInput({
  emails,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}: EmailListInputProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [text, setText] = useState("");
  const [rejected, setRejected] = useState<string[]>([]);

  function commit(value: string) {
    if (!value.trim()) return;
    const change = addEmails(emails, value);
    onChange(change.emails);
    setRejected(change.rejected);
    setText(change.rejected.join(" "));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (commitKeys.has(event.key) && text.trim()) {
      // Tab still moves on after the chip is made.
      if (event.key !== "Tab") event.preventDefault();
      commit(text);
      return;
    }
    if (event.key === "Backspace" && !text && emails.length) {
      onChange(emails.slice(0, -1));
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    commit(`${text} ${event.clipboardData.getData("text")}`);
  }

  const message =
    error ?? (rejected.length ? EmailListInputText.rejected(rejected) : null);

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {EmailListInputText.label}
      </label>
      <div
        className={styles.box}
        data-invalid={Boolean(message)}
        data-disabled={disabled}
      >
        {emails.map((email) => (
          <span key={email} className={styles.chip}>
            {email}
            <button
              type="button"
              className={styles.remove}
              aria-label={EmailListInputText.remove(email)}
              onClick={() =>
                onChange(emails.filter((other) => other !== email))
              }
              disabled={disabled}
            >
              <Icon name="close" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="email"
          className={styles.input}
          value={text}
          placeholder={
            emails.length
              ? EmailListInputText.morePlaceholder
              : EmailListInputText.placeholder
          }
          onChange={(event) => {
            setText(event.target.value);
            if (rejected.length) setRejected([]);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => commit(text)}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-describedby={message ? `${hintId} ${errorId}` : hintId}
          aria-invalid={Boolean(message)}
        />
      </div>
      <p id={hintId} className={styles.hint}>
        {EmailListInputText.hint}
      </p>
      {message ? (
        <p id={errorId} className={styles.error} role="alert">
          <Icon name="error" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
