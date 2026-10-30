// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/NewTaskDialog.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Makes a one-off task (not from an event): the basics in a dialog.
// It starts in the workspace's first open status; post text, a checklist and
// links can be added on the task's page.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import {
  checkTaskDraft,
  emptyTaskDraft,
  fieldsFromDraft,
  type TaskDraft,
} from "../model/taskDraft";
import { createTask } from "../service/taskService";
import { TaskForm, type TaskFormOptions } from "./TaskForm";
import { NewTaskText as Text } from "./tasksContent";

interface NewTaskDialogProps {
  options: TaskFormOptions;
  timeZone: string;
  /** The status new tasks start in; null when the workspace has none. */
  startingStatusId: string | null;
  createdBy: string;
  /** Who it's given to at first (the person making it). */
  start?: Partial<TaskDraft>;
  onCreated: (taskId: string, title: string) => void;
  onClose: () => void;
}

export function NewTaskDialog({
  options,
  timeZone,
  startingStatusId,
  createdBy,
  start,
  onCreated,
  onClose,
}: NewTaskDialogProps) {
  const [draft, setDraft] = useState<TaskDraft>({
    ...emptyTaskDraft,
    ...start,
  });
  const [tried, setTried] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      createTask(
        fieldsFromDraft(draft, timeZone),
        startingStatusId ?? "",
        createdBy,
      ),
    onSuccess: (taskId) => onCreated(taskId, draft.title.trim()),
  });

  function submit() {
    setTried(true);
    if (checkTaskDraft(draft) || !startingStatusId) return;
    create.mutate();
  }

  return (
    <Modal
      title={Text.title}
      description={Text.description}
      size="wide"
      onClose={create.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            iconStart="add"
            onClick={submit}
            disabled={!startingStatusId}
            isLoading={create.isPending}
          >
            {Text.create}
          </Button>
        </>
      }
    >
      {!startingStatusId ? (
        <Banner tone="alert">{Text.noStatuses}</Banner>
      ) : null}
      {create.error ? (
        <Banner tone="error">{dataErrorMessage(create.error)}</Banner>
      ) : null}
      <TaskForm
        draft={draft}
        onChange={(changes) =>
          setDraft((current) => ({ ...current, ...changes }))
        }
        options={options}
        showProblems={tried}
      />
    </Modal>
  );
}
