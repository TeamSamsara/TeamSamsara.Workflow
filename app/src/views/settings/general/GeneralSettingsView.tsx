// File : /TeamSamsara.Workflow/app/src/views/settings/general/GeneralSettingsView.tsx
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Settings → General: the workspace's name, time and date settings
// and default theme, saved together. Everyone signed in sees a rename at once
// (the sidebar reads the live workspace). Leaving with unsaved changes asks
// first.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useBlocker } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { dataErrorMessage } from "@/core/data";
import {
  updateWorkspace,
  useWorkspaceRecord,
  type WorkspaceSettings,
} from "@/core/workspace";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { checkName } from "@/shared/validation/nameRules";
import { GeneralSettingsForm } from "./GeneralSettingsForm";
import { GeneralSettingsViewText as Text } from "./generalSettingsViewContent";
import styles from "./GeneralSettingsView.module.css";

type Editable = Omit<
  WorkspaceSettings,
  "enabledPlatformIds" | "premiumPlatformIds"
>;

const fields = [
  "name",
  "timeZone",
  "weekStartsOn",
  "dateFormat",
  "timeFormat",
  "defaultTheme",
] as const satisfies readonly (keyof Editable)[];

export function GeneralSettingsView() {
  const workspace = useWorkspaceRecord();
  const { can } = usePermissions();
  const toast = useToast();
  const canChange = can("manageSettings");

  const saved: Editable = {
    name: workspace.name,
    timeZone: workspace.timeZone,
    weekStartsOn: workspace.weekStartsOn,
    dateFormat: workspace.dateFormat,
    timeFormat: workspace.timeFormat,
    defaultTheme: workspace.defaultTheme,
  };
  // Only what was changed is kept; everything else follows the live workspace.
  const [edits, setEdits] = useState<Partial<Editable>>({});
  const draft: Editable = { ...saved, ...edits };
  const changed = fields.filter((field) => draft[field] !== saved[field]);
  const isDirty = changed.length > 0;
  const nameError = checkName(draft.name);

  const save = useMutation({
    mutationFn: () =>
      updateWorkspace(
        Object.fromEntries(
          changed.map((field) => [
            field,
            field === "name" ? draft.name.trim() : draft[field],
          ]),
        ),
      ),
    onSuccess: () => {
      setEdits({});
      toast.show({ tone: "success", title: Text.saved });
    },
  });

  const blocker = useBlocker(isDirty);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{Text.title}</h2>
          <p className={styles.muted}>{Text.description}</p>
        </div>
        {canChange ? (
          <div className={styles.actions}>
            <Button
              variant="ghost"
              onClick={() => setEdits({})}
              disabled={!isDirty || save.isPending}
            >
              {Text.reset}
            </Button>
            <Button
              variant="primary"
              onClick={() => save.mutate()}
              disabled={!isDirty || Boolean(nameError)}
              isLoading={save.isPending}
            >
              {Text.save}
            </Button>
          </div>
        ) : null}
      </header>

      {canChange ? null : (
        <Banner tone="info" icon="lock">
          {Text.readOnly}
        </Banner>
      )}
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}

      <GeneralSettingsForm
        settings={{
          ...draft,
          enabledPlatformIds: workspace.enabledPlatformIds,
          premiumPlatformIds: workspace.premiumPlatformIds,
        }}
        onChange={(changes) => {
          setEdits((current) => ({ ...current, ...changes }));
          if (save.error) save.reset();
        }}
        nameError={nameError}
        disabled={!canChange || save.isPending}
      />

      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setEdits({});
                  blocker.proceed();
                }}
              >
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </div>
  );
}
