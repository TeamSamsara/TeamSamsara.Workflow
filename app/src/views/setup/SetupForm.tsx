// File : /TeamSamsara.Workflow/app/src/views/setup/SetupForm.tsx
// Version : 1.2.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The setup form, used only by SetupView, in two steps: the
// workspace (name, time zone, week start, time format), then the account that
// becomes its first Admin. Already signed in, only the name is asked for.

import { useMemo, useState, type FormEvent } from "react";
import {
  DateFormats,
  TimeFormats,
  WeekStarts,
  type TimeFormat,
  type WeekStart,
} from "@/core/data";
import { signOut, type SessionUser } from "@/core/session";
import type { SetupDetails } from "@/core/workspace";
import {
  checkEmail,
  checkNewPassword,
  hasFieldErrors,
  PasswordRules,
  type FieldErrors,
} from "@/features/auth";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { PasswordField } from "@/shared/components/Fields/PasswordField/PasswordField";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import {
  deviceTimeZone,
  deviceUses24HourClock,
  timeZoneOptions,
} from "@/shared/time/timeZones";
import { checkName } from "@/shared/validation/nameRules";
import { TextLimits } from "@/shared/validation/textLimits";
import { SetupFormText } from "./setupViewContent";
import styles from "./SetupView.module.css";

export type SetupStep = "workspace" | "account";

interface SetupFormProps {
  step: SetupStep;
  onStepChange: (step: SetupStep) => void;
  /** Signed in already: this account becomes the Admin. */
  signedInUser: SessionUser | null;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (details: SetupDetails) => void;
}

const weekStartOptions = WeekStarts.map((value) => ({
  value,
  label: SetupFormText.weekStarts[value],
}));

const timeFormatOptions = TimeFormats.map((value) => ({
  value,
  label: SetupFormText.timeFormats[value],
}));

type WorkspaceField = "name";
type AccountField = "displayName" | "email" | "password" | "confirmation";

export function SetupForm({
  step,
  onStepChange,
  signedInUser,
  isSaving,
  errorMessage,
  onSubmit,
}: SetupFormProps) {
  const zones = useMemo(() => timeZoneOptions(), []);

  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState(deviceTimeZone);
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStart>(WeekStarts[0]);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() =>
    deviceUses24HourClock() ? "24h" : "12h",
  );

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [triedWorkspace, setTriedWorkspace] = useState(false);
  const [triedAccount, setTriedAccount] = useState(false);

  function workspaceErrors(): FieldErrors<WorkspaceField> {
    return { name: checkName(name) };
  }

  function accountErrors(): FieldErrors<AccountField> {
    const nameError = { displayName: checkName(displayName) };
    if (signedInUser) return nameError;
    return {
      ...nameError,
      email: checkEmail(email),
      ...checkNewPassword({ password, confirmation }),
    };
  }

  const shownWorkspaceErrors = triedWorkspace ? workspaceErrors() : {};
  const shownAccountErrors = triedAccount ? accountErrors() : {};

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriedWorkspace(true);
    if (hasFieldErrors(workspaceErrors())) return;
    onStepChange("account");
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriedAccount(true);
    if (hasFieldErrors(accountErrors())) return;
    onSubmit({
      workspace: {
        name,
        timeZone,
        weekStartsOn,
        dateFormat: DateFormats[0],
        timeFormat,
        defaultTheme: "device",
        enabledPlatformIds: [],
        premiumPlatformIds: [],
      },
      account: { displayName, email, password },
      signedInUser,
    });
  }

  if (step === "workspace") {
    return (
      <form className={styles.form} onSubmit={handleContinue} noValidate>
        <h2 className={styles.sectionHeading}>
          {SetupFormText.workspaceHeading}
        </h2>
        <TextField
          label={SetupFormText.workspaceName}
          value={name}
          maxLength={TextLimits.name}
          autoComplete="organization"
          onChange={(event) => setName(event.target.value)}
          hint={SetupFormText.workspaceNameHint}
          error={shownWorkspaceErrors.name}
          autoFocus
        />
        <div className={styles.fieldRow}>
          <Select
            label={SetupFormText.timeZone}
            options={zones}
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            hint={SetupFormText.timeZoneHint}
          />
          <Select
            label={SetupFormText.weekStartsOn}
            options={weekStartOptions}
            value={weekStartsOn}
            onChange={(event) =>
              setWeekStartsOn(
                WeekStarts.find((value) => value === event.target.value) ??
                  WeekStarts[0],
              )
            }
          />
        </div>
        <div className={styles.choice}>
          {/* Shown like a field label; the control names itself for screen readers. */}
          <span className={styles.choiceLabel} aria-hidden="true">
            {SetupFormText.timeFormat}
          </span>
          <SegmentedControl
            label={SetupFormText.timeFormat}
            options={timeFormatOptions}
            value={timeFormat}
            onChange={setTimeFormat}
          />
        </div>
        <Button type="submit" variant="primary" size="large" fullWidth>
          {SetupFormText.next}
        </Button>
      </form>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleCreate} noValidate>
      {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}
      <h2 className={styles.sectionHeading}>{SetupFormText.accountHeading}</h2>
      <TextField
        label={SetupFormText.yourName}
        value={displayName}
        maxLength={TextLimits.name}
        autoComplete="name"
        onChange={(event) => setDisplayName(event.target.value)}
        error={shownAccountErrors.displayName}
        autoFocus
      />
      {signedInUser ? (
        <div className={styles.signedIn}>
          <p>{SetupFormText.signedInAs(signedInUser.email)}</p>
          <Button
            variant="ghost"
            size="small"
            iconStart="logOut"
            onClick={() => void signOut()}
            disabled={isSaving}
          >
            {SetupFormText.useAnotherAccount}
          </Button>
        </div>
      ) : (
        <>
          <TextField
            label={SetupFormText.email}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={shownAccountErrors.email}
          />
          <PasswordField
            label={SetupFormText.password}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={shownAccountErrors.password}
          />
          <PasswordField
            label={SetupFormText.confirmation}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            error={shownAccountErrors.confirmation}
          />
          <PasswordRules password={password} confirmation={confirmation} />
        </>
      )}
      <div className={styles.actions}>
        <Button
          size="large"
          iconStart="back"
          onClick={() => onStepChange("workspace")}
          disabled={isSaving}
        >
          {SetupFormText.back}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={isSaving}
          className={styles.submit}
        >
          {SetupFormText.submit}
        </Button>
      </div>
    </form>
  );
}
