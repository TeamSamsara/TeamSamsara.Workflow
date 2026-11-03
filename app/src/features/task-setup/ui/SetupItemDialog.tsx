// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/SetupItemDialog.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The frame every list dialog shares (status, event type, tag): a
// form with Cancel and Add/Save, and for an existing item a Delete that asks
// once more before deleting, or says why it can't.

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { DialogText } from "./taskSetupContent";
import styles from "./SetupDialogs.module.css";

interface SetupItemDialogProps {
  title: string;
  /** The item's name, for the delete question; null for a new item. */
  existingName: string | null;
  children: ReactNode;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isBusy: boolean;
  error: string | null;
  /** Why it can't be deleted, if it can't. */
  deleteBlocker?: string | null;
  /** What deleting does, said before asking. */
  deleteNote?: string;
}

export function SetupItemDialog({
  title,
  existingName,
  children,
  onSubmit,
  onDelete,
  onClose,
  isBusy,
  error,
  deleteBlocker,
  deleteNote,
}: SetupItemDialogProps) {
  const formId = useId();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isNew = existingName === null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const footer = isConfirmingDelete ? (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsConfirmingDelete(false)}
        disabled={isBusy}
      >
        {DialogText.cancel}
      </Button>
      <Button
        variant="danger"
        iconStart="trash"
        onClick={onDelete}
        isLoading={isBusy}
      >
        {DialogText.delete}
      </Button>
    </>
  ) : (
    <>
      {isNew ? null : (
        <Button
          variant="ghost"
          iconStart="trash"
          onClick={() => setIsConfirmingDelete(true)}
          disabled={isBusy || Boolean(deleteBlocker)}
          className={styles.deleteButton}
        >
          {DialogText.delete}
        </Button>
      )}
      <Button variant="ghost" onClick={onClose} disabled={isBusy}>
        {DialogText.cancel}
      </Button>
      <Button type="submit" form={formId} variant="primary" isLoading={isBusy}>
        {isNew ? DialogText.create : DialogText.save}
      </Button>
    </>
  );

  return (
    <Modal title={title} onClose={isBusy ? undefined : onClose} footer={footer}>
      <form
        id={formId}
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        {error ? <Banner tone="error">{error}</Banner> : null}
        {isConfirmingDelete && existingName ? (
          <>
            <p className={styles.text}>
              {DialogText.confirmDelete(existingName)}
            </p>
            {deleteNote ? <p className={styles.muted}>{deleteNote}</p> : null}
          </>
        ) : (
          <>
            {children}
            {!isNew && deleteBlocker ? (
              <p className={styles.muted}>{deleteBlocker}</p>
            ) : null}
          </>
        )}
      </form>
    </Modal>
  );
}
