// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/DeleteWorkGroupDialog.tsx
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : Confirms deleting a work group: its members stay in the workspace
// and tasks stay with the people working on them. Then deletes it.

import { useMutation } from "@tanstack/react-query";
import { dataErrorMessage } from "@/core/data";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { deleteWorkGroup } from "../service/workGroupService";
import type { WorkGroupRecord } from "../types/workGroupTypes";
import { DeleteWorkGroupDialogText } from "./workGroupsContent";
import styles from "./WorkGroupDialogs.module.css";

interface DeleteWorkGroupDialogProps {
  group: WorkGroupRecord;
  memberCount: number | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteWorkGroupDialog({
  group,
  memberCount,
  onClose,
  onDeleted,
}: DeleteWorkGroupDialogProps) {
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: () => deleteWorkGroup(group.id),
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: DeleteWorkGroupDialogText.deleted(group.name),
      });
      onDeleted();
    },
  });

  return (
    <Modal
      title={DeleteWorkGroupDialogText.title(group.name)}
      onClose={mutation.isPending ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {DeleteWorkGroupDialogText.cancel}
          </Button>
          <Button
            variant="danger"
            iconStart="trash"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {DeleteWorkGroupDialogText.confirm}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        {mutation.error ? (
          <Banner tone="error">{dataErrorMessage(mutation.error)}</Banner>
        ) : null}
        <p className={styles.text}>
          {DeleteWorkGroupDialogText.body(memberCount)}
        </p>
        <p className={styles.text}>{DeleteWorkGroupDialogText.cannotUndo}</p>
      </div>
    </Modal>
  );
}
