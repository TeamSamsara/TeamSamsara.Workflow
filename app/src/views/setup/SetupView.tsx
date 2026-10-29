// File : /TeamSamsara.Workflow/app/src/views/setup/SetupView.tsx
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Set up your workspace: the page a brand-new install opens on. Three
// steps (workspace, your account, done). Once a workspace exists the page is
// closed, except for the person who has just finished it.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { dataErrorKind } from "@/core/data";
import {
  AuthErrorText,
  authErrorKind,
  useSession,
  type SessionUser,
} from "@/core/session";
import {
  setUpWorkspace,
  useWorkspace,
  type SetupDetails,
} from "@/core/workspace";
import { AuthHeading } from "@/features/auth";
import { Button } from "@/shared/components/Button/Button";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { RoutePaths } from "@/shared/constants/routePaths";
import { Icon } from "@/shared/icons/Icon";
import { SetupForm, type SetupStep } from "./SetupForm";
import { SetupFormText, SetupViewText } from "./setupViewContent";
import styles from "./SetupView.module.css";

type Progress = SetupStep | "done";

const stepOrder: readonly Progress[] = ["workspace", "account", "done"];

/** What went wrong, in words: a sign-in problem, or the batch being refused. */
function setupErrorMessage(error: unknown): string {
  const authKind = authErrorKind(error);
  if (authKind !== "unknown") return AuthErrorText[authKind];
  const dataKind = dataErrorKind(error);
  if (dataKind === "offline") return SetupFormText.errors.offline;
  if (dataKind === "notAllowed") return SetupFormText.errors.notAllowed;
  return SetupFormText.errors.unknown;
}

function StepIndicator({ current }: { current: Progress }) {
  const reached = stepOrder.indexOf(current);
  return (
    <ol className={styles.steps} aria-label={SetupViewText.steps.label}>
      {stepOrder.map((step, index) => (
        <li
          key={step}
          className={styles.step}
          data-reached={index <= reached}
          aria-current={index === reached ? "step" : undefined}
        >
          <span className={styles.stepNumber}>
            {index < reached ? <Icon name="check" /> : index + 1}
          </span>
          {SetupViewText.steps[step]}
        </li>
      ))}
    </ol>
  );
}

export function SetupView() {
  const workspace = useWorkspace();
  const session = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<SetupStep>("workspace");
  const [finishedName, setFinishedName] = useState<string | null>(null);

  const setup = useMutation({
    mutationFn: (details: SetupDetails) => setUpWorkspace(details),
    onSuccess: (_result, details) =>
      setFinishedName(details.workspace.name.trim()),
  });

  if (finishedName !== null) {
    return (
      <div className={styles.view}>
        <StepIndicator current="done" />
        <AuthHeading
          title={SetupViewText.doneTitle}
          description={SetupViewText.doneDescription(finishedName)}
        />
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={() => navigate(RoutePaths.calendar, { replace: true })}
        >
          {SetupViewText.openApp}
        </Button>
      </div>
    );
  }

  // While saving, the new workspace shows up before the server confirms it, so
  // stay put until the answer is in.
  if (workspace.status === "ready" && !setup.isPending) {
    return <Navigate to={RoutePaths.calendar} replace />;
  }

  if (workspace.status === "loading" || session.status === "loading") {
    return (
      <div className={styles.loading}>
        <Spinner label={SetupViewText.loading} />
      </div>
    );
  }

  const signedInUser: SessionUser | null =
    session.status === "noAccess" && session.reason === "noRecord"
      ? session.user
      : null;

  return (
    <div className={styles.view}>
      <StepIndicator current={step} />
      <AuthHeading
        title={SetupViewText.title}
        description={SetupViewText.description}
      />
      <SetupForm
        step={step}
        onStepChange={setStep}
        signedInUser={signedInUser}
        isSaving={setup.isPending}
        errorMessage={setup.error ? setupErrorMessage(setup.error) : null}
        onSubmit={setup.mutate}
      />
    </div>
  );
}
