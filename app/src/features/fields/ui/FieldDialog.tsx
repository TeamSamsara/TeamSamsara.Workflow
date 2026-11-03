// File : /TeamSamsara.Workflow/app/src/features/fields/ui/FieldDialog.tsx
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : Makes a field, or changes one (admins): its name (which gives the
// key text writes it as, kept once made), its type, the choices of a choice
// field and a help line.

import { useMutation } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { Icon } from "@/shared/icons/Icon";
import { createField, updateField } from "../service/fieldService";
import {
  FieldLimits,
  FieldTypes,
  isBuiltInField,
  keyFromName,
  type FieldRecord,
  type FieldType,
} from "../types/fieldTypes";
import { FieldDialogText as Text, FieldTypeText } from "./fieldsContent";
import styles from "./FieldDialog.module.css";

interface FieldDialogProps {
  /** The field to change; leave out to make one. */
  field?: FieldRecord;
  /** Keys already taken, so a new one doesn't clash. */
  takenKeys: ReadonlySet<string>;
  /** A name to start from (what was typed in a picker). */
  initialName?: string;
  /** Made from a picker: the button says it inserts too. */
  inserts?: boolean;
  onClose: () => void;
  onSaved?: (key: string) => void;
}

export function FieldDialog({
  field,
  takenKeys,
  initialName = "",
  inserts = false,
  onClose,
  onSaved,
}: FieldDialogProps) {
  const session = useSession();
  const toast = useToast();
  const [name, setName] = useState(field?.name ?? initialName);
  const [type, setType] = useState<FieldType>(field?.type ?? "text");
  const [choices, setChoices] = useState<string[]>(field?.choices ?? []);
  const [choice, setChoice] = useState("");
  const [help, setHelp] = useState(field?.help ?? "");
  const [tried, setTried] = useState(false);

  const key = field?.id ?? keyFromName(name);
  const nameProblem = !name.trim()
    ? Text.nameRequired
    : field
      ? null
      : isBuiltInField(key)
        ? Text.keyBuiltIn
        : takenKeys.has(key)
          ? Text.keyTaken
          : null;
  const choicesProblem =
    type === "choice" && choices.length === 0 && !choice.trim()
      ? Text.needChoices
      : null;

  const save = useMutation({
    mutationFn: async () => {
      const finalChoices = choice.trim() ? [...choices, choice] : choices;
      const fields = { name, type, choices: finalChoices, help };
      if (field) return updateField(field.id, fields);
      const memberId =
        session.status === "active" ? session.member.id : "unknown";
      return createField(key, fields, memberId);
    },
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: field ? Text.saved(name.trim()) : Text.created(name.trim()),
      });
      onSaved?.(key);
      onClose();
    },
  });

  function submit() {
    setTried(true);
    if (!nameProblem && !choicesProblem) save.mutate();
  }

  function addChoice() {
    const next = choice.trim().slice(0, FieldLimits.choice);
    if (next && !choices.includes(next) && choices.length < FieldLimits.choices)
      setChoices([...choices, next]);
    setChoice("");
  }

  function handleChoiceKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addChoice();
    } else if (event.key === "Backspace" && !choice && choices.length) {
      setChoices(choices.slice(0, -1));
    }
  }

  return (
    <Modal
      title={field ? Text.editTitle(field.name) : Text.newTitle}
      description={Text.description}
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          {field ? null : (
            <span className={styles.footNote}>{Text.adminsOnly}</span>
          )}
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.cancel}
          </Button>
          <Button variant="primary" onClick={submit} isLoading={save.isPending}>
            {field ? Text.save : inserts ? Text.createAndInsert : Text.create}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        {save.error ? (
          <Banner tone="error">
            {Text.failed}: {dataErrorMessage(save.error)}
          </Banner>
        ) : null}
        <TextField
          label={Text.name}
          placeholder={Text.namePlaceholder}
          value={name}
          maxLength={FieldLimits.name}
          onChange={(event) => setName(event.target.value)}
          error={tried ? nameProblem : null}
          hint={
            key ? (
              <>
                {Text.writtenAs}{" "}
                <code className={styles.key}>{`{${key}}`}</code>.{" "}
                {field ? null : Text.keyStays}
              </>
            ) : null
          }
          autoFocus
        />
        <fieldset className={styles.types}>
          <legend className={styles.legend}>{Text.type}</legend>
          <div className={styles.typeGrid}>
            {FieldTypes.map((value) => (
              <label
                key={value}
                className={styles.type}
                data-on={value === type}
              >
                <input
                  type="radio"
                  name="field-type"
                  className={styles.radio}
                  checked={value === type}
                  onChange={() => setType(value)}
                />
                <b>{FieldTypeText[value].name}</b>
                <span className={styles.muted}>
                  {FieldTypeText[value].hint}
                </span>
              </label>
            ))}
          </div>
          {field && type !== field.type ? (
            <p className={styles.muted}>{Text.typeChange}</p>
          ) : null}
        </fieldset>
        {type === "choice" ? (
          <div className={styles.choicesField}>
            <span className={styles.legend} id="field-choices">
              {Text.choices}
            </span>
            <div
              className={styles.choices}
              data-invalid={Boolean(tried && choicesProblem)}
            >
              {choices.map((entry) => (
                <span key={entry} className={styles.choice}>
                  {entry}
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={Text.removeChoice(entry)}
                    onClick={() =>
                      setChoices(choices.filter((other) => other !== entry))
                    }
                  >
                    <Icon name="close" />
                  </button>
                </span>
              ))}
              <input
                aria-labelledby="field-choices"
                className={styles.choiceInput}
                placeholder={Text.addChoice}
                value={choice}
                maxLength={FieldLimits.choice}
                onChange={(event) => setChoice(event.target.value)}
                onKeyDown={handleChoiceKey}
                onBlur={addChoice}
              />
            </div>
            {tried && choicesProblem ? (
              <p className={styles.error}>{choicesProblem}</p>
            ) : null}
          </div>
        ) : null}
        <TextField
          label={`${Text.help} ${Text.optional}`}
          placeholder={Text.helpPlaceholder}
          value={help}
          maxLength={FieldLimits.help}
          onChange={(event) => setHelp(event.target.value)}
        />
      </div>
    </Modal>
  );
}
