// File : /TeamSamsara.Workflow/app/src/views/settings/general/generalSettingsViewContent.ts
// Version : 1.2.0
// Latest commit: feature/remember-me
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
    "Events and tasks are planned in the workspace time zone. Each person can see times in their own from Your account.",
  lookHeading: "Look",
  defaultTheme: "Default theme for new members",
  themes: {
    light: "Light",
    dark: "Dark",
    device: "Match device",
  } satisfies Record<ThemeChoice, string>,
  themeHint: "Each person can still pick their own with the theme button.",
  signInHeading: "Signing in",
  sessionDays: "Ask for the password again after",
  sessionDayOptions: (days: number) =>
    days === 0 ? "Never: until they sign out" : `${days} days`,
  sessionHint:
    "Counted from when someone last typed their password. Unticking Keep me signed in ends it sooner, when the browser closes.",
  dateFormatNames: {
    weekdayMonthDay: "Weekday, month and day",
    monthDay: "Month and day",
    dayMonth: "Day and month",
    isoDate: "Year-month-day",
  } satisfies Record<DateFormat, string>,
} as const;
