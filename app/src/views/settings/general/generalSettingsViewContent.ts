// File : /TeamSamsara.Workflow/app/src/views/settings/general/generalSettingsViewContent.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : The words on Settings → General.

import type { DateFormat, TimeFormat, WeekStart } from "@/core/data";
import type { ThemeChoice } from "@/core/theme";

export const GeneralSettingsViewText = {
  title: "General",
  description: "Basics for the whole workspace.",
  reset: "Reset",
  save: "Save changes",
  saved: "Workspace settings saved",
  readOnly: "Only members with Manage settings can change these.",
  discard: {
    title: "Discard your changes?",
    body: "These settings have changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
} as const;

export const GeneralSettingsFormText = {
  workspaceHeading: "Workspace",
  name: "Workspace name",
  nameHint: "Shown in the sidebar and in emails.",
  timeHeading: "Time and dates",
  timeZone: "Workspace time zone",
  weekStartsOn: "Week starts on",
  weekStarts: { monday: "Monday", sunday: "Sunday" } satisfies Record<
    WeekStart,
    string
  >,
  dateFormat: "Date format",
  /** Each choice shown as an example date. */
  dateFormatExample: "Example",
  timeFormat: "Time format",
  timeFormats: {
    "12h": "7:00 PM (12-hour)",
    "24h": "19:00 (24-hour)",
  } satisfies Record<TimeFormat, string>,
  timeNote:
    "Events are planned in the workspace time zone. Each person will be able to see times in their own, from their account page.",
  lookHeading: "Look",
  defaultTheme: "Default theme for new members",
  themes: {
    light: "Light",
    dark: "Dark",
    device: "Match device",
  } satisfies Record<ThemeChoice, string>,
  themeHint: "Each person can still pick their own with the theme button.",
  dateFormatNames: {
    weekdayMonthDay: "Weekday, month and day",
    monthDay: "Month and day",
    dayMonth: "Day and month",
    isoDate: "Year-month-day",
  } satisfies Record<DateFormat, string>,
} as const;
