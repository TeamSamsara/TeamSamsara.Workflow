// File : /TeamSamsara.Workflow/app/src/features/fields/ui/FieldInput.tsx
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The input for one field's value when planning an event, the kind
// its type needs: text, a link, a number, a dropdown of its choices, a date
// and time, or someone on the team. A key with no field yet is asked as text.

import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { nameFromKey, type FieldRecord } from "../types/fieldTypes";
import { FieldInputText as Text } from "./fieldsContent";

/** The most a value can hold (as an event's details do). */
export const fieldValueLimit = 200;

interface FieldInputProps {
  fieldKey: string;
  field: FieldRecord | undefined;
  value: string;
  onChange: (value: string) => void;
  /** Who a person field can be. */
  people: readonly { id: string; name: string }[];
  /** A line under it, like where it's used. */
  note?: string;
}

export function FieldInput({
  fieldKey,
  field,
  value,
  onChange,
  people,
  note,
}: FieldInputProps) {
  const label = field?.name ?? nameFromKey(fieldKey);
  const hint =
    [field?.help, note, field ? null : Text.notAField]
      .filter(Boolean)
      .join(" ") || undefined;

  if (field?.type === "choice") {
    // A value saved before a choice was renamed still shows.
    const choices =
      value && !field.choices.includes(value)
        ? [...field.choices, value]
        : field.choices;
    return (
      <Select
        label={label}
        hint={hint}
        options={[
          { value: "", label: Text.notPicked },
          ...choices.map((choice) => ({ value: choice, label: choice })),
        ]}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field?.type === "person") {
    const known = people.some((person) => person.id === value);
    return (
      <Select
        label={label}
        hint={hint}
        options={[
          { value: "", label: Text.nobody },
          ...people.map((person) => ({ value: person.id, label: person.name })),
          ...(value && !known ? [{ value, label: value }] : []),
        ]}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <TextField
      label={label}
      hint={hint}
      value={value}
      maxLength={fieldValueLimit}
      onChange={(event) => onChange(event.target.value)}
      {...(field?.type === "link"
        ? { type: "url", inputMode: "url", placeholder: Text.linkPlaceholder }
        : field?.type === "number"
          ? { inputMode: "decimal" }
          : field?.type === "datetime"
            ? { type: "datetime-local" }
            : { placeholder: `{${fieldKey}}` })}
    />
  );
}
