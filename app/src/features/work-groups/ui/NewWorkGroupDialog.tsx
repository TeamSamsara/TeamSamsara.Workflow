// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/NewWorkGroupDialog.tsx
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Creates a work group from its name and what it does; the caller
// opens it straight after.

import { useMutation } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { dataErrorMessage } from "@/core/data";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { checkName } from "@/shared/validation/nameRules";
import { createWorkGroup } from "../service/workGroupService";
import type { WorkGroupFields } from "../types/workGroupTypes";
import { WorkGroupForm } from "./WorkGroupForm";
import { NewWorkGroupDialogText } from "./workGroupsContent";
import styles from "./WorkGroupDialogs.module.css";

interface NewWorkGroupDialogProps {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}

export function NewWorkGroupDialog({
  onClose,
  onCreated,
}: NewWorkGroupDialogProps) {
  const toast = useToast();
  const formId = useId();
  const [fields, setFields] = useState<WorkGroupFields>({
    name: "",
    description: "",
    leadIds: [],
    links: [],
  });
  const [tried, setTried] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createWorkGroup(fields),
    onSuccess: (groupId) => {
      toast.show({
        tone: "success",
        title: NewWorkGroupDialogText.created(fields.name.trim()),
      });
      onCreated(groupId);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (checkName(fields.name)) return;
    mutation.mutate();
  }

  return (
    <Modal
      title={NewWorkGroupDialogText.title}
      description={NewWorkGroupDialogText.description}
      onClose={mutation.isPending ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {NewWorkGroupDialogText.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            iconStart="add"
            isLoading={mutation.isPending}
          >
            {NewWorkGroupDialogText.create}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.body}
        onSubmit={handleSubmit}
        noValidate
      >
        {mutation.error ? (
          <Banner tone="error">{dataErrorMessage(mutation.error)}</Banner>
        ) : null}
        <WorkGroupForm
          fields={fields}
          onChange={(changes) => setFields({ ...fields, ...changes })}
          nameError={tried ? checkName(fields.name) : undefined}
          autoFocusName
        />
      </form>
    </Modal>
  );
}
