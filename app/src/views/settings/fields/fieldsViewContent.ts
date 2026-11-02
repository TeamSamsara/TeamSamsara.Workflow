// File : /TeamSamsara.Workflow/app/src/views/settings/fields/fieldsViewContent.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The words of Settings › Fields.

export const FieldsViewText = {
  title: "Fields",
  description:
    "The details events can have. Put a field in a workflow's tasks or an event's title, and planning the event asks for it.",
  newField: "New field",
  caption: "Fields",
  field: "Field",
  writtenAs: "Write it as",
  type: "Type",
  usedIn: "Used in",
  notUsed: "Not used yet",
  choices: (count: number) => `Choice · ${count}`,
  edit: (name: string) => `Edit ${name}`,
  remove: (name: string) => `Delete ${name}`,
  none: "No fields yet. Make one here, or type {opponent} in a workflow and it's asked for as text until it's made a field.",
  builtIn: "Built in",
  builtInNote:
    "Every event fills these by itself. They can't be changed or deleted.",
  adminsOnly: "Only admins can change or delete a field.",
  failed: "Couldn't load the fields",
  deleteDialog: {
    title: (name: string) => `Delete ${name}?`,
    body: "Events keep the values they have, and text that uses it still fills in from them. It just isn't asked for when planning anymore.",
    cancel: "Cancel",
    confirm: "Delete field",
    deleted: (name: string) => `${name} deleted`,
  },
} as const;
