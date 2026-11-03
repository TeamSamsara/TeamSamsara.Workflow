// File : /TeamSamsara.Workflow/app/src/features/roles/ui/NewRoleDialog.tsx
// Version : 1.1.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Creates a role from a name and a colour. It lands just above
// Everyone with no permissions, and the caller opens it straight after.

import { useMutation } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { dataErrorMessage } from "@/core/data";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { ColorPicker } from "@/shared/components/Fields/ColorPicker/ColorPicker";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { DefaultColor } from "@/shared/constants/colorPresets";
import { checkName } from "@/shared/validation/nameRules";
import { TextLimits } from "@/shared/validation/textLimits";
import { createRole } from "../service/roleService";
import { NewRoleDialogText } from "./roleDialogsContent";
import styles from "./RoleDialogs.module.css";

interface NewRoleDialogProps {
  onClose: () => void;
  onCreated: (roleId: string) => void;
}

export function NewRoleDialog({ onClose, onCreated }: NewRoleDialogProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DefaultColor);
  const [tried, setTried] = useState(false);
  const formId = useId();

  const mutation = useMutation({
    mutationFn: () =>
      createRole({ name, color, description: "", permissions: [] }),
    onSuccess: (roleId) => {
      toast.show({
        tone: "success",
        title: NewRoleDialogText.created(name.trim()),
      });
      onCreated(roleId);
    },
  });

  const nameError = tried ? checkName(name) : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (checkName(name)) return;
    mutation.mutate();
  }

  return (
    <Modal
      title={NewRoleDialogText.title}
      description={NewRoleDialogText.description}
      onClose={mutation.isPending ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {NewRoleDialogText.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            iconStart="add"
            isLoading={mutation.isPending}
          >
            {NewRoleDialogText.create}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        {mutation.error ? (
          <Banner tone="error">{dataErrorMessage(mutation.error)}</Banner>
        ) : null}
        <TextField
          label={NewRoleDialogText.name}
          placeholder={NewRoleDialogText.namePlaceholder}
          value={name}
          maxLength={TextLimits.name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
          autoFocus
        />
        <ColorPicker value={color} onChange={setColor} />
      </form>
    </Modal>
  );
}
