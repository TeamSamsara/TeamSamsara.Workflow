// File : /TeamSamsara.Workflow/app/src/features/fields/types/fieldTypes.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : A field: a detail events can have (Opponent, League, Co-streamer),
// kept under the key text writes it as ({opponent}). The key is the document's
// id, so it never changes; the name, type, choices and help can. Also the
// built-in fields every event fills by itself.

import {
  createConverter,
  readDate,
  readString,
  readStringList,
} from "@/core/data";
import {
  BuiltInFieldKeys,
  nameFromKey,
  type BuiltInFieldKey,
} from "@engine/gaps";

// The fields every event fills itself, and a key's name, live in the engine.
export {
  BuiltInFieldKeys,
  nameFromKey,
  type BuiltInFieldKey,
} from "@engine/gaps";

export const FieldTypes = [
  "text",
  "link",
  "number",
  "choice",
  "datetime",
  "person",
] as const;
export type FieldType = (typeof FieldTypes)[number];

export interface FieldRecord {
  /** How text writes it, without the braces: "opponent". */
  id: string;
  name: string;
  type: FieldType;
  /** The options of a choice field, in order; empty for other types. */
  choices: string[];
  /** Shown under the field when planning. */
  help: string;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** The part of a field its dialog changes. */
export type FieldFields = Pick<
  FieldRecord,
  "name" | "type" | "choices" | "help"
>;

/** firestore.rules checks the same. */
export const FieldLimits = {
  name: 40,
  help: 120,
  choices: 20,
  choice: 40,
  key: 30,
  /** How many fields a workspace can have. */
  fields: 100,
} as const;

/** The details every event fills by itself, in the order they're listed. */

export function isBuiltInField(key: string): key is BuiltInFieldKey {
  return (BuiltInFieldKeys as readonly string[]).includes(key);
}

/** A key a field can have: a letter, then letters, digits or _ (30 at most). */
export const fieldKeyPattern = /^[a-z][a-z0-9_]{0,29}$/;

/** "Co-streamer" → "co_streamer", "1st map" → "f_1st_map". */
export function keyFromName(name: string): string {
  const key = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const lettered = /^[a-z]/.test(key) ? key : `f_${key}`;
  return lettered.slice(0, FieldLimits.key).replace(/_+$/, "");
}

/** "opponent" → "Opponent", "co_streamer" → "Co streamer": for a key with no field. */
function readFieldType(value: string): FieldType {
  return (FieldTypes as readonly string[]).includes(value)
    ? (value as FieldType)
    : "text";
}

export const fieldConverter = createConverter<FieldRecord>({
  parse: (id, data) => ({
    id,
    name: readString(data, "name") || nameFromKey(id),
    type: readFieldType(readString(data, "type")),
    choices: readStringList(data, "choices"),
    help: readString(data, "help"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data, "createdAt"),
    updatedAt: readDate(data, "updatedAt"),
  }),
  serialize: (field) =>
    Object.fromEntries(Object.entries(field).filter(([key]) => key !== "id")),
});
