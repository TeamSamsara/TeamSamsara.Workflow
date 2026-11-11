// File : /TeamSamsara.Workflow/app/src/features/events/ui/SetEditDialogs.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Filling in a set's events after they're planned. From the set's
// table, one field of one event (an opponent that was TBD); from Edit set,
// the set's name, its title pattern and fields for every event at once. Titles
// that follow the pattern and tasks' text fill again, the way editing one
// event does; anything changed by hand stays.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { FieldInput, useFields } from "@/features/fields";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { useAudienceOptions } from "../hooks/useAudienceOptions";
import { useEventTasks } from "../hooks/useEvents";
import { useSetGaps } from "../hooks/useSetGaps";
import { useTaskFormats } from "../hooks/useTaskFormats";
import { gapLabel } from "../model/applyWorkflows";
import { planGaps } from "../model/planDraft";
import { planEventEdit, planSetEdit, sharedValue } from "../model/setEdit";
import { saveEventEdits, tasksOfEvents } from "../service/setService";
import type { EventRecord } from "../types/eventTypes";
import { EventSetLimits, type EventSetRecord } from "../types/setTypes";
import { SetText as Text } from "./planContent";
import styles from "./SetEditDialogs.module.css";

const refilled = (edits: readonly { refills: readonly unknown[] }[]) =>
  edits.reduce((total, edit) => total + edit.refills.length, 0);

interface FillFieldDialogProps {
  set: EventSetRecord;
  event: EventRecord;
  fieldKey: string;
  /** "Sat, Nov 14 · 7:00 PM", to say which event. */
  when: string;
  onClose: () => void;
}

export function FillFieldDialog({
  set,
  event,
  fieldKey,
  when,
  onClose,
}: FillFieldDialogProps) {
  const session = useSession();
  const tasks = useEventTasks(
    event.id,
    session.status === "active" ? session.member : null,
  );
  const workflows = useWorkflows();
  const fields = useFields();
  const formats = useTaskFormats();
  const people = useAudienceOptions();
  const toast = useToast();
  const [value, setValue] = useState(event.details[fieldKey] ?? "");
  const label = gapLabel(fieldKey, fields.items);

  const save = useMutation({
    mutationFn: async () => {
      const edit = planEventEdit(
        event,
        { details: { [fieldKey]: value }, pattern: set.titlePattern },
        tasks.items,
        workflows.items,
        formats,
      );
      if (edit) await saveEventEdits([edit]);
      return edit;
    },
    onSuccess: (edit) => {
      toast.show({
        tone: "success",
        title: Text.fillDialog.saved(
          edit?.title ?? event.title,
          edit?.refills.length ?? 0,
        ),
      });
      onClose();
    },
  });

  return (
    <Modal
      title={label}
      description={`${event.title} · ${when}`}
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.fillDialog.cancel}
          </Button>
          <Button
            variant="primary"
            isLoading={save.isPending}
            disabled={
              tasks.status === "loading" || workflows.status === "loading"
            }
            onClick={() => save.mutate()}
          >
            {Text.fillDialog.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <FieldInput
        fieldKey={fieldKey}
        field={fields.byKey(fieldKey)}
        value={value}
        people={people.members}
        onChange={setValue}
      />
    </Modal>
  );
}

interface EditSetDialogProps {
  set: EventSetRecord;
  /** Its events this planner can see. */
  events: readonly EventRecord[];
  onClose: () => void;
}

export function EditSetDialog({ set, events, onClose }: EditSetDialogProps) {
  const workflows = useWorkflows();
  const fields = useFields();
  const formats = useTaskFormats();
  const people = useAudienceOptions();
  const toast = useToast();
  const setGaps = useSetGaps(set);
  const [name, setName] = useState(set.name);
  const [pattern, setPattern] = useState(set.titlePattern);
  const gaps = [
    ...new Set([
      ...setGaps,
      ...planGaps(pattern, []),
      ...events.flatMap((event) => Object.keys(event.details)),
    ]),
  ];
  const [values, setValues] = useState<Record<string, string>>({});
  const initial = (key: string) => sharedValue(events, key);
  const valueOf = (key: string) => values[key] ?? initial(key) ?? "";

  /** The fields that change: edited, and not left empty where events differ. */
  function changedDetails(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(values).filter(([key, value]) => {
        const before = initial(key);
        if (before === null) return value.trim() !== "";
        return value.trim() !== before.trim();
      }),
    );
  }

  const isValid = name.trim() !== "" && pattern.trim() !== "";
  const save = useMutation({
    mutationFn: async () => {
      const tasks = await tasksOfEvents(events.map((event) => event.id));
      const edits = planSetEdit(
        events,
        {
          details: changedDetails(),
          pattern: set.titlePattern,
          newPattern: pattern.trim(),
        },
        tasks,
        workflows.items,
        formats,
      );
      const setChanged =
        name.trim() !== set.name || pattern.trim() !== set.titlePattern;
      await saveEventEdits(
        edits,
        setChanged ? { id: set.id, name, titlePattern: pattern } : undefined,
      );
      return edits;
    },
    onSuccess: (edits) => {
      toast.show({
        tone: "success",
        title: Text.editDialog.saved(edits.length, refilled(edits)),
      });
      onClose();
    },
  });

  return (
    <Modal
      title={Text.editDialog.title}
      size="wide"
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.editDialog.cancel}
          </Button>
          <Button
            variant="primary"
            isLoading={save.isPending}
            disabled={!isValid || workflows.status === "loading"}
            onClick={() => save.mutate()}
          >
            {Text.editDialog.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <div className={styles.form}>
        <TextField
          label={Text.editDialog.name}
          value={name}
          maxLength={EventSetLimits.name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label={Text.editDialog.pattern}
          help={Text.editDialog.patternHelp}
          value={pattern}
          maxLength={120}
          onChange={(event) => setPattern(event.target.value)}
        />
        {gaps.length > 0 ? (
          <fieldset className={styles.fields}>
            <legend className={styles.legend}>{Text.editDialog.fields}</legend>
            {gaps.map((key) => (
              <FieldInput
                key={key}
                fieldKey={key}
                field={fields.byKey(key)}
                value={valueOf(key)}
                people={people.members}
                note={
                  initial(key) === null && !(key in values)
                    ? Text.editDialog.differs
                    : undefined
                }
                onChange={(value) =>
                  setValues((current) => ({ ...current, [key]: value }))
                }
              />
            ))}
          </fieldset>
        ) : null}
      </div>
    </Modal>
  );
}
