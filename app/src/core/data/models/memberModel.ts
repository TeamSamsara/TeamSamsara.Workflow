// File : /TeamSamsara.Workflow/app/src/core/data/models/memberModel.ts
// Version : 1.6.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The member record (members/{account id}): who the person is, whether
// they may use the app, and which roles and work groups they are in. A record
// with no valid status counts as disabled, so a broken record never grants access.

import type { DocumentData } from "firebase/firestore";
import { createConverter } from "../firestoreConverter";
import {
  readChoice,
  readDate,
  readOptionalString,
  readString,
  readStringList,
} from "../fieldReaders";
import { fromDate } from "../timestamps";
import {
  DateFormats,
  TimeFormats,
  type DateFormat,
  type TimeFormat,
} from "./workspaceModel";

/**
 * invited: has an account but hasn't signed in yet. active: signed in at least
 * once. disabled: access turned off, can be turned back on. removed: taken out
 * of the workspace; the record stays so their name still shows on old work,
 * and inviting the same email again brings them back.
 */
export const MemberStatuses = [
  "invited",
  "active",
  "disabled",
  "removed",
] as const;
export type MemberStatus = (typeof MemberStatuses)[number];

/** Everyone still in the workspace (not removed): the people lists show these. */
export function isCurrentMember(member: Pick<MemberRecord, "status">): boolean {
  return member.status !== "removed";
}

export interface Walkthrough {
  done: string[];
  hidden: boolean;
}

function readWalkthrough(data: DocumentData): Walkthrough | null {
  const value = data.walkthrough;
  if (value === null || typeof value !== "object") return null;
  return {
    done: Array.isArray(value.done)
      ? value.done.filter((id: unknown): id is string => typeof id === "string")
      : [],
    hidden: value.hidden === true,
  };
}

export interface TeamViewPrefs {
  hidden: string[];
  order: string[];
  zone: "team" | "mine";
}

function readTeamView(data: DocumentData): TeamViewPrefs {
  const prefs: unknown = data.prefs;
  const view =
    prefs && typeof prefs === "object"
      ? (prefs as DocumentData).teamView
      : undefined;
  const value = (view && typeof view === "object" ? view : {}) as DocumentData;
  return {
    hidden: readStringList(value, "hidden"),
    order: readStringList(value, "order"),
    zone: value.zone === "mine" ? "mine" : "team",
  };
}

export interface MemberRecord {
  /** The member's sign-in account id, which is also the document id. */
  id: string;
  displayName: string;
  email: string;
  status: MemberStatus;
  roleIds: string[];
  workGroupIds: string[];
  /**
   * Their highest role's position (Owners above all), and the work groups
   * they lead. Kept by the server for permission checks; never written here.
   */
  rank: number;
  leadOf: string[];
  /** Shown first wherever they appear, with the real name under it. */
  gameName: string | null;
  /** Their profile photo (a download address in Storage); null shows initials. */
  photoUrl: string | null;
  /** The member's own time zone; null means "use the workspace's". */
  timeZone: string | null;
  /** How they see dates and times; null means "use the workspace's". */
  dateFormat: DateFormat | null;
  timeFormat: TimeFormat | null;
  /**
   * Their walkthrough: the chapters done (or skipped), and whether they hid
   * its card. null until they first see it, which is when it offers itself.
   */
  walkthrough: Walkthrough | null;
  /** People tags on them (Starter, Coach…); empty for most. */
  tagIds: string[];
  /** How they like Team availability: who they hide, their order, whose time. */
  teamView: TeamViewPrefs;
  /** Account id of the member who sent the invite, if any. */
  invitedBy: string | null;
  invitedAt: Date | null;
  /** When they first signed in. */
  joinedAt: Date | null;
  lastActiveAt: Date | null;
}

function parse(id: string, data: DocumentData): MemberRecord {
  return {
    id,
    displayName: readString(data, "displayName"),
    email: readString(data, "email"),
    status: readChoice(data, "status", MemberStatuses, "disabled"),
    roleIds: readStringList(data, "roleIds"),
    workGroupIds: readStringList(data, "workGroupIds"),
    rank: typeof data.rank === "number" ? data.rank : 0,
    leadOf: readStringList(data, "leadOf"),
    gameName: readOptionalString(data, "gameName"),
    photoUrl: readOptionalString(data, "photoUrl"),
    timeZone: readOptionalString(data, "timeZone"),
    dateFormat: DateFormats.includes(data.dateFormat)
      ? (data.dateFormat as DateFormat)
      : null,
    timeFormat: TimeFormats.includes(data.timeFormat)
      ? (data.timeFormat as TimeFormat)
      : null,
    walkthrough: readWalkthrough(data),
    tagIds: readStringList(data, "tagIds"),
    teamView: readTeamView(data),
    invitedBy: readOptionalString(data, "invitedBy"),
    invitedAt: readDate(data, "invitedAt"),
    joinedAt: readDate(data, "joinedAt"),
    lastActiveAt: readDate(data, "lastActiveAt"),
  };
}

function serialize(member: MemberRecord): DocumentData {
  return {
    displayName: member.displayName,
    email: member.email,
    status: member.status,
    roleIds: member.roleIds,
    workGroupIds: member.workGroupIds,
    gameName: member.gameName,
    photoUrl: member.photoUrl,
    timeZone: member.timeZone,
    dateFormat: member.dateFormat,
    timeFormat: member.timeFormat,
    walkthrough: member.walkthrough,
    invitedBy: member.invitedBy,
    invitedAt: fromDate(member.invitedAt),
    joinedAt: fromDate(member.joinedAt),
    lastActiveAt: fromDate(member.lastActiveAt),
  };
}

export const memberConverter = createConverter({ parse, serialize });
export const parseMember = parse;
export const serializeMember = serialize;
