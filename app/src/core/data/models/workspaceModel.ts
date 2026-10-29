// File : /TeamSamsara.Workflow/app/src/core/data/models/workspaceModel.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : The workspace record (config/workspace): its name, the time zone
// events are planned in, week start, time format, the default theme for new
// members, and which platforms are switched on.

import type { DocumentData } from "firebase/firestore";
import type { ThemeChoice } from "@/core/theme";
import { createConverter } from "../firestoreConverter";
import {
  readChoice,
  readDate,
  readString,
  readStringList,
} from "../fieldReaders";
import { fromDate } from "../timestamps";

export const WeekStarts = ["monday", "sunday"] as const;
export type WeekStart = (typeof WeekStarts)[number];

export const TimeFormats = ["12h", "24h"] as const;
export type TimeFormat = (typeof TimeFormats)[number];

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
  timeFormat: TimeFormat;
  /** What a member sees before picking a theme of their own. */
  defaultTheme: ThemeChoice;
  /** Ids from the built-in platform catalogue that this workspace uses. */
  enabledPlatformIds: string[];
  createdAt: Date | null;
}

function parse(_id: string, data: DocumentData): WorkspaceRecord {
  return {
    name: readString(data, "name"),
    timeZone: readString(data, "timeZone", fallbackTimeZone),
    weekStartsOn: readChoice(data, "weekStartsOn", WeekStarts, "monday"),
    timeFormat: readChoice(data, "timeFormat", TimeFormats, "12h"),
    defaultTheme: readChoice(
      data,
      "defaultTheme",
      WorkspaceThemeChoices,
      "device",
    ),
    enabledPlatformIds: readStringList(data, "enabledPlatformIds"),
    createdAt: readDate(data, "createdAt"),
  };
}

function serialize(workspace: WorkspaceRecord): DocumentData {
  return {
    name: workspace.name,
    timeZone: workspace.timeZone,
    weekStartsOn: workspace.weekStartsOn,
    timeFormat: workspace.timeFormat,
    defaultTheme: workspace.defaultTheme,
    enabledPlatformIds: workspace.enabledPlatformIds,
    createdAt: fromDate(workspace.createdAt),
  };
}

export const workspaceConverter = createConverter({ parse, serialize });
export const parseWorkspace = parse;
export const serializeWorkspace = serialize;
