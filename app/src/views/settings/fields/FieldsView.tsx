// File : /TeamSamsara.Workflow/app/src/views/settings/fields/FieldsView.tsx
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Settings › Fields: every field with how text writes it, its type
// and the workflows that use it; then the built-in ones. Edit workflows makes
// fields; only admins change or delete them.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { usePermissions } from "@/core/access";
import { dataErrorMessage } from "@/core/data";
import {
  BuiltInFieldKeys,
  BuiltInFieldText,
  deleteField,
  FieldDialog,
  FieldTypeText,
  useFields,
  type FieldRecord,
} from "@/features/fields";
import { useWorkflows, workflowGaps } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Modal } from "@/shared/components/Modal/Modal";
import { Table } from "@/shared/components/Table/Table";
import { useToast } from "@/shared/components/Toast/useToast";
import { FieldsViewText as Text } from "./fieldsViewContent";
import styles from "./FieldsView.module.css";

function DeleteFieldDialog({
  field,
  onClose,
}: {
  field: FieldRecord;
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useMutation({
    mutationFn: () => deleteField(field.id),
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: Text.deleteDialog.deleted(field.name),
      });
      onClose();
    },
  });
  return (
    <Modal
      title={Text.deleteDialog.title(field.name)}
      onClose={remove.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
            {Text.deleteDialog.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={() => remove.mutate()}
            isLoading={remove.isPending}
          >
            {Text.deleteDialog.confirm}
          </Button>
        </>
      }
    >
      {remove.error ? (
        <Banner tone="error">{dataErrorMessage(remove.error)}</Banner>
      ) : null}
      <p className={styles.muted}>{Text.deleteDialog.body}</p>
    </Modal>
  );
}

export function FieldsView() {
  const access = usePermissions();
  const fields = useFields();
  const workflows = useWorkflows();
  const [editing, setEditing] = useState<FieldRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<FieldRecord | null>(null);
  // Edit workflows makes, changes and deletes fields.
  const isAdmin = access.can("editWorkflows");
  const canMake = access.can("editWorkflows");

  const usedIn = (key: string) =>
    workflows.items
      .filter((workflow) => workflowGaps(workflow.steps).asked.includes(key))
      .map((workflow) => workflow.name);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{Text.title}</h2>
          <p className={styles.muted}>{Text.description}</p>
        </div>
        {canMake ? (
          <Button
            variant="primary"
            iconStart="add"
            onClick={() => setEditing("new")}
          >
            {Text.newField}
          </Button>
        ) : null}
      </header>

      {fields.status === "error" ? (
        <Banner tone="error">{Text.failed}</Banner>
      ) : null}

      <section className={styles.card}>
        {fields.status === "ready" && fields.items.length === 0 ? (
          <p className={styles.empty}>{Text.none}</p>
        ) : (
          <Table caption={Text.caption} minWidth={720}>
            <thead>
              <tr>
                <th>{Text.field}</th>
                <th>{Text.writtenAs}</th>
                <th>{Text.type}</th>
                <th>{Text.usedIn}</th>
                {isAdmin ? <th aria-hidden="true" /> : null}
              </tr>
            </thead>
            <tbody>
              {fields.items.map((field) => {
                const used = usedIn(field.id);
                return (
                  <tr key={field.id}>
                    <td>
                      <span className={styles.name}>
                        <b>{field.name}</b>
                        {field.help ? (
                          <span className={styles.muted}>{field.help}</span>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <code className={styles.key}>{`{${field.id}}`}</code>
                    </td>
                    <td>
                      {field.type === "choice"
                        ? Text.choices(field.choices.length)
                        : FieldTypeText[field.type].name}
                    </td>
                    <td className={styles.used}>
                      {used.length > 0 ? used.join(", ") : Text.notUsed}
                    </td>
                    {isAdmin ? (
                      <td className={styles.actions}>
                        <IconButton
                          icon="edit"
                          variant="ghost"
                          size="small"
                          label={Text.edit(field.name)}
                          onClick={() => setEditing(field)}
                        />
                        <IconButton
                          icon="trash"
                          variant="ghost"
                          size="small"
                          label={Text.remove(field.name)}
                          onClick={() => setDeleting(field)}
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>

      <section className={styles.builtIn}>
        <div className={styles.builtInHead}>
          <h3 className={styles.subtitle}>{Text.builtIn}</h3>
          <span className={styles.muted}>{Text.builtInNote}</span>
        </div>
        <ul className={styles.builtInList}>
          {BuiltInFieldKeys.map((key) => (
            <li key={key} className={styles.builtInItem}>
              <b>{BuiltInFieldText[key]}</b>
              <code className={styles.muted}>{`{${key}}`}</code>
            </li>
          ))}
        </ul>
      </section>

      {editing ? (
        <FieldDialog
          field={editing === "new" ? undefined : editing}
          takenKeys={new Set(fields.items.map((field) => field.id))}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <DeleteFieldDialog field={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </div>
  );
}
