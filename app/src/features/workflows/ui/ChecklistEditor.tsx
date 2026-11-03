// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/ChecklistEditor.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : A task's checklist: one box per item, Remove, and Add item. Enter
// in the last box adds the next one.

import { useRef } from "react";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { localId } from "../model/localId";
import { WorkflowLimits, type ChecklistItem } from "../types/workflowTypes";
import { ChecklistEditorText as Text } from "./workflowsContent";
import styles from "./StepEditor.module.css";

interface ChecklistEditorProps {
  items: readonly ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const list = useRef<HTMLOListElement>(null);
  const canAdd = items.length < WorkflowLimits.checklistItems;

  function add() {
    if (!canAdd) return;
    onChange([...items, { id: localId(), text: "" }]);
    // Focus the new box once it's on the page.
    requestAnimationFrame(() =>
      list.current
        ?.querySelector<HTMLInputElement>("li:last-child input")
        ?.focus(),
    );
  }

  return (
    <div className={styles.listEditor}>
      {items.length === 0 ? <p className={styles.muted}>{Text.none}</p> : null}
      <ol ref={list} className={styles.items}>
        {items.map((item, index) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.bullet} aria-hidden="true" />
            <TextField
              label={Text.item(index)}
              hideLabel
              value={item.text}
              placeholder={index === 0 ? Text.placeholder : undefined}
              maxLength={WorkflowLimits.checklistItem}
              onChange={(event) =>
                onChange(
                  items.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, text: event.target.value }
                      : entry,
                  ),
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && index === items.length - 1) {
                  event.preventDefault();
                  add();
                }
              }}
              className={styles.itemField}
            />
            <IconButton
              icon="trash"
              label={Text.remove(index)}
              variant="ghost"
              size="small"
              onClick={() =>
                onChange(items.filter((entry) => entry.id !== item.id))
              }
            />
          </li>
        ))}
      </ol>
      <Button
        size="small"
        iconStart="add"
        onClick={add}
        disabled={!canAdd}
        className={styles.addButton}
      >
        {Text.add}
      </Button>
    </div>
  );
}
