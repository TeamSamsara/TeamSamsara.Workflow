// File : /TeamSamsara.Workflow/app/src/core/data/models/workspaceModel.ts
// Version : 1.3.0
// Latest commit: feature/remember-me
// Author : Gerrah
// Purpose : The workspace record (config/workspace): its name, the time zone
// events are planned in, week start, date and time formats, the default theme for new
// members, which platforms are switched on, and which paid tiers it has.

import type { DocumentData } from "firebase/firestore";
import type { ThemeChoice } from "@/core/theme";
import { createConverter } from "../firestoreConverter";
import {
  readChoice,
  readDate,
  readString,
  readStringList,
} from "../fieldReaders";
import { DateFormats, type DateFormat } from "@/shared/time/dates";
import { fromDate } from "../timestamps";

export const WeekStarts = ["monday", "sunday"] as const;
export type WeekStart = (typeof WeekStarts)[number];

export const TimeFormats = ["12h", "24h"] as const;
export type TimeFormat = (typeof TimeFormats)[number];

// How dates are written lives with the date helpers that write them.
export { DateFormats, type DateFormat };

/**
 * The theme choices a workspace can default to. Listed here rather than imported,
 * because the theme module reads the workspace and an import back would loop;
 * `satisfies` keeps the two lists in step.
 */
const WorkspaceThemeChoices = [
  "light",
  "dark",
  "device",
] as const satisfies readonly ThemeChoice[];

/** Used when a record has no time zone; setup always saves a real one. */
export const fallbackTimeZone = "UTC";

export interface WorkspaceRecord {
  name: string;
  /** IANA time zone the team plans in, e.g. "America/Toronto". */
  timeZone: string;
  weekStartsOn: WeekStart;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  /** What a member sees before picking a theme of their own. */
  defaultTheme: ThemeChoice;
  /** Ids from the built-in platform catalogue that this workspace uses. */
  enabledPlatformIds: string[];
  /** Platforms whose paid tier the workspace's account has (e.g. X Premium). */
  upgradedPlatformIds: string[];
  /** Days a sign-in lasts before the password is asked again; 0 is never. */
  sessionDays: SessionDays;
  createdAt: Date | null;
}

/** How long a sign-in can last; 0 means until they sign out. */
export const SessionDayOptions = [7, 14, 30, 90, 0] as const;
export type SessionDays = (typeof SessionDayOptions)[number];
export const defaultSessionDays: SessionDays = 30;

function readSessionDays(data: DocumentData): SessionDays {
  const value: unknown = data.sessionDays;
  return (
    SessionDayOptions.find((option) => option === value) ?? defaultSessionDays
  );
}

function parse(_id: string, data: DocumentData): WorkspaceRecord {
  return {
    name: readString(data, "name"),
    timeZone: readString(data, "timeZone", fallbackTimeZone),
    weekStartsOn: readChoice(data, "weekStartsOn", WeekStarts, "monday"),
    // Workspaces made before this setting existed read as the first format.
    dateFormat: readChoice(data, "dateFormat", DateFormats, DateFormats[0]),
    timeFormat: readChoice(data, "timeFormat", TimeFormats, "12h"),
    defaultTheme: readChoice(
      data,
      "defaultTheme",
      WorkspaceThemeChoices,
      "device",
    ),
    enabledPlatformIds: readStringList(data, "enabledPlatformIds"),
    upgradedPlatformIds: readStringList(data, "upgradedPlatformIds"),
    // Workspaces made before this setting existed last 30 days.
    sessionDays: readSessionDays(data),
    createdAt: readDate(data, "createdAt"),
  };
}

function serialize(workspace: WorkspaceRecord): DocumentData {
  return {
    name: workspace.name,
    timeZone: workspace.timeZone,
    weekStartsOn: workspace.weekStartsOn,
    dateFormat: workspace.dateFormat,
    timeFormat: workspace.timeFormat,
    defaultTheme: workspace.defaultTheme,
    enabledPlatformIds: workspace.enabledPlatformIds,
    upgradedPlatformIds: workspace.upgradedPlatformIds,
    sessionDays: workspace.sessionDays,
    createdAt: fromDate(workspace.createdAt),
  };
}

export const workspaceConverter = createConverter({ parse, serialize });
export const parseWorkspace = parse;
export const serializeWorkspace = serialize;
