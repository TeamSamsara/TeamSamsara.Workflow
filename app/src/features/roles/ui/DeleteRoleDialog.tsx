// File : /TeamSamsara.Workflow/app/src/features/roles/ui/DeleteRoleDialog.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Confirms deleting a role, saying how many members lose it (nobody
// leaves the workspace), then deletes it.

import { useMutation } from "@tanstack/react-query";
import { dataErrorMessage, type RoleRecord } from "@/core/data";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { deleteRole } from "../service/roleService";
import { DeleteRoleDialogText } from "./roleDialogsContent";
import styles from "./RoleDialogs.module.css";

interface DeleteRoleDialogProps {
  role: RoleRecord;
  memberCount: number | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteRoleDialog({
  role,
  memberCount,
  onClose,
  onDeleted,
}: DeleteRoleDialogProps) {
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: () => deleteRole(role.id),
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: DeleteRoleDialogText.deleted(role.name),
      });
      onDeleted();
    },
  });

  return (
    <Modal
      title={DeleteRoleDialogText.title(role.name)}
      onClose={mutation.isPending ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {DeleteRoleDialogText.cancel}
          </Button>
          <Button
            variant="danger"
            iconStart="trash"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {DeleteRoleDialogText.confirm}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {mutation.error ? (
          <Banner tone="error">{dataErrorMessage(mutation.error)}</Banner>
        ) : null}
        <p className={styles.text}>{DeleteRoleDialogText.body(memberCount)}</p>
        <p className={styles.text}>{DeleteRoleDialogText.cannotUndo}</p>
      </div>
    </Modal>
  );
}
