// File : /TeamSamsara.Workflow/app/src/features/fields/index.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : What the rest of the app may use from fields: the details events
// can have, how their values read in text, and their dialog and inputs.

export { useFields } from "./hooks/useFields";
export type { FieldList } from "./hooks/useFields";
export { fieldText } from "./model/fieldText";
export type { FieldTextOptions } from "./model/fieldText";
export { deleteField } from "./service/fieldService";
export {
  BuiltInFieldKeys,
  fieldConverter,
  fieldKeyPattern,
  FieldLimits,
  FieldTypes,
  isBuiltInField,
  keyFromName,
  nameFromKey,
} from "./types/fieldTypes";
export type {
  BuiltInFieldKey,
  FieldFields,
  FieldRecord,
  FieldType,
} from "./types/fieldTypes";
export { FieldDialog } from "./ui/FieldDialog";
export { FieldInput, fieldValueLimit } from "./ui/FieldInput";
export {
  BuiltInFieldText,
  FieldDialogText,
  FieldTypeText,
} from "./ui/fieldsContent";
