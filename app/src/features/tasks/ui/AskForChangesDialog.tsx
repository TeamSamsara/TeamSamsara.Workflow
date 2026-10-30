// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/AskForChangesDialog.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Sends a task back with a note on what to change. The note shows on
// the task until it's sent for review again.

import { useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { Modal } from "@/shared/components/Modal/Modal";
import { TaskLimits } from "../types/taskTypes";
import { AskForChangesText as Text } from "./tasksContent";

interface AskForChangesDialogProps {
  isSending: boolean;
  onSend: (note: string) => void;
  onClose: () => void;
}

export function AskForChangesDialog({
  isSending,
  onSend,
  onClose,
}: AskForChangesDialogProps) {
  const [note, setNote] = useState("");
  return (
    <Modal
      title={Text.title}
      onClose={isSending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSending}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => onSend(note)}
            disabled={!note.trim()}
            isLoading={isSending}
          >
            {Text.send}
          </Button>
        </>
      }
    >
      <TextArea
        label={Text.note}
        placeholder={Text.placeholder}
        value={note}
        maxLength={TaskLimits.changesNote}
        onChange={(event) => setNote(event.target.value)}
        autoFocus
      />
    </Modal>
  );
}
