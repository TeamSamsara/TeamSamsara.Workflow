// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/StatusDialog.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Adds or edits a status: its name, its pill colour, and what it
// counts as. The last open and the last finished status can't change what
// they count as, or be deleted.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Collections,
  dataErrorMessage,
  StatusCategories,
  StatusTones,
  type StatusCategory,
  type StatusRecord,
  type StatusTone,
} from "@/core/data";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useToast } from "@/shared/components/Toast/useToast";
import { checkName } from "@/shared/validation/nameRules";
import { TextLimits } from "@/shared/validation/textLimits";
import {
  addSetupItem,
  deleteSetupItem,
  saveSetupItem,
} from "../service/setupListService";
import {
  categoryChangeBlocker,
  deleteStatusBlocker,
} from "../service/statusRules";
import { SetupItemDialog } from "./SetupItemDialog";
import { StatusPill } from "./StatusPill";
import {
  DialogText,
  StatusCategoryText,
  StatusDialogText as Text,
  StatusToneText,
} from "./taskSetupContent";
import styles from "./SetupDialogs.module.css";

interface StatusDialogProps {
  /** The status to edit, or null to add one. */
  status: StatusRecord | null;
  statuses: readonly StatusRecord[];
  onClose: () => void;
}

type Action = "save" | "delete";

export function StatusDialog({ status, statuses, onClose }: StatusDialogProps) {
  const toast = useToast();
  const [name, setName] = useState(status?.name ?? "");
  const [tone, setTone] = useState<StatusTone>(status?.tone ?? "neutral");
  const [category, setCategory] = useState<StatusCategory>(
    status?.category ?? "open",
  );
  const [tried, setTried] = useState(false);

  const lastPosition = Math.max(-1, ...statuses.map((item) => item.position));
  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      if (action === "delete" && status) {
        await deleteSetupItem(Collections.statuses, status.id);
        return;
      }
      const data = { name, tone, category };
      if (status) await saveSetupItem(Collections.statuses, status.id, data);
      else await addSetupItem(Collections.statuses, data, lastPosition);
    },
    onSuccess: (_result, action) => {
      const shown = action === "delete" ? (status?.name ?? "") : name.trim();
      toast.show({
        tone: "success",
        title:
          action === "delete"
            ? DialogText.deleted(shown)
            : status
              ? DialogText.saved(shown)
              : DialogText.added(shown),
      });
      onClose();
    },
  });

  const nameError = tried ? checkName(name) : undefined;
  const deleteBlocked = status
    ? deleteStatusBlocker(statuses, status.id)
    : null;

  function submit() {
    setTried(true);
    if (checkName(name)) return;
    mutation.mutate("save");
  }

  return (
    <SetupItemDialog
      title={status ? Text.editTitle(status.name) : Text.newTitle}
      existingName={status?.name ?? null}
      onSubmit={submit}
      onDelete={() => mutation.mutate("delete")}
      onClose={onClose}
      isBusy={mutation.isPending}
      error={mutation.error ? dataErrorMessage(mutation.error) : null}
      deleteBlocker={deleteBlocked ? Text.blocked[deleteBlocked] : null}
    >
      <TextField
        label={Text.name}
        placeholder={Text.namePlaceholder}
        value={name}
        maxLength={TextLimits.name}
        onChange={(event) => setName(event.target.value)}
        error={nameError}
        autoFocus
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{Text.tone}</legend>
        <div className={styles.tones}>
          {StatusTones.map((value) => (
            <label
              key={value}
              className={styles.tone}
              title={StatusToneText[value]}
            >
              <input
                type="radio"
                name="status-tone"
                className={styles.radio}
                checked={tone === value}
                onChange={() => setTone(value)}
                aria-label={StatusToneText[value]}
              />
              <StatusPill
                status={{
                  name: name.trim() || Text.namePlaceholder,
                  tone: value,
                }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{Text.category}</legend>
        <div className={styles.categories}>
          {StatusCategories.map((value) => {
            const blocked =
              status !== null &&
              categoryChangeBlocker(statuses, status.id, value) !== null;
            return (
              <label key={value} className={styles.category}>
                <input
                  type="radio"
                  name="status-category"
                  className={styles.categoryInput}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                  disabled={blocked}
                />
                <span className={styles.categoryText}>
                  <b>{StatusCategoryText[value].label}</b>
                  <span className={styles.muted}>
                    {StatusCategoryText[value].description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className={styles.muted}>{Text.categoryHint}</p>
      </fieldset>
    </SetupItemDialog>
  );
}
