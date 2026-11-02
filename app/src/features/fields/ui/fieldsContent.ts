// File : /TeamSamsara.Workflow/app/src/features/fields/ui/fieldsContent.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The words of the field dialog and the field inputs.

import type { BuiltInFieldKey, FieldType } from "../types/fieldTypes";

export const FieldTypeText: Record<FieldType, { name: string; hint: string }> =
  {
    text: { name: "Text", hint: "A word or a sentence" },
    link: { name: "Link", hint: "A web address" },
    number: { name: "Number", hint: "A score, a prize" },
    choice: { name: "Choice", hint: "One from a list" },
    datetime: { name: "Date and time", hint: "Shown in your formats" },
    person: { name: "Person", hint: "Someone on the team" },
  };

export const BuiltInFieldText: Record<BuiltInFieldKey, string> = {
  title: "Title",
  date: "Date",
  time: "Time",
  end_time: "Ends",
  link: "Link",
  event_type: "Event type",
};

export const FieldDialogText = {
  newTitle: "New field",
  editTitle: (name: string) => `Edit ${name}`,
  description:
    "A detail events can have. Planning an event asks for it when its title or workflows use it.",
  name: "Name",
  namePlaceholder: "Opponent",
  nameRequired: "Give it a name.",
  writtenAs: "Written in text as",
  keyStays: "That stays the same if the name changes later.",
  keyTaken: "There's already a field written like that. Pick another name.",
  keyBuiltIn: "That's a built-in field. Pick another name.",
  type: "Type",
  choices: "Choices",
  addChoice: "Add a choice",
  removeChoice: (choice: string) => `Remove ${choice}`,
  needChoices: "Add at least one choice.",
  help: "Help",
  optional: "(optional)",
  helpPlaceholder: "Shown under the field when planning",
  adminsOnly: "Only admins can rename or delete a field once it's made.",
  typeChange:
    "Values already saved stay as they are, so changing the type can leave some that don't fit.",
  cancel: "Cancel",
  create: "Create field",
  createAndInsert: "Create and insert",
  save: "Save",
  failed: "Couldn't save the field",
  created: (name: string) => `${name} made`,
  saved: (name: string) => `${name} saved`,
} as const;

export const FieldInputText = {
  notPicked: "Not picked yet",
  nobody: "Nobody yet",
  linkPlaceholder: "https://",
  notAField: "Not set up as a field yet: asked as text.",
} as const;
