// File : /TeamSamsara.Workflow/app/src/features/fields/service/fieldService.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : Makes, changes and deletes fields. Anyone who edits workflows can
// make one; only admins can change or delete one (firestore.rules agrees).
// Deleting a field keeps the values events already have: text that uses it
// still fills in, it just isn't listed anymore.

import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { Collections, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";
import { FieldLimits, type FieldFields } from "../types/fieldTypes";

function fieldData(fields: FieldFields) {
  const choices =
    fields.type === "choice"
      ? [
          ...new Set(
            fields.choices
              .map((choice) => choice.trim().slice(0, FieldLimits.choice))
              .filter(Boolean),
          ),
        ].slice(0, FieldLimits.choices)
      : [];
  return {
    name: fields.name.trim().slice(0, FieldLimits.name),
    type: fields.type,
    choices,
    help: fields.help.trim().slice(0, FieldLimits.help),
  };
}

export function createField(
  key: string,
  fields: FieldFields,
  createdBy: string,
): Promise<void> {
  return setDoc(doc(db, Collections.fields, key), {
    ...fieldData(fields),
    createdBy,
    createdAt: serverTime(),
    updatedAt: serverTime(),
  });
}

export function updateField(key: string, fields: FieldFields): Promise<void> {
  return updateDoc(doc(db, Collections.fields, key), {
    ...fieldData(fields),
    updatedAt: serverTime(),
  });
}

export function deleteField(key: string): Promise<void> {
  return deleteDoc(doc(db, Collections.fields, key));
}
