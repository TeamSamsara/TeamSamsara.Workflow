// File : /TeamSamsara.Workflow/app/src/features/fields/model/fieldText.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : How a field's value reads in text. Values are kept as plain text:
// a person is their member id, a date and time is "2026-11-14T19:00" in the
// workspace's time (the event's own clock), anything else as typed.

// Moved to the engine, which the server functions share.
export { fieldText, type FieldTextOptions } from "@engine/fieldText";
