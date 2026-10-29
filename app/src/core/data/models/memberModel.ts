// File : /TeamSamsara.Workflow/app/src/core/data/models/memberModel.ts
// Version : 1.1.0
// Latest commit: feature/members
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

export interface MemberRecord {
  /** The member's sign-in account id, which is also the document id. */
  id: string;
  displayName: string;
  email: string;
  status: MemberStatus;
  roleIds: string[];
  workGroupIds: string[];
  /** The member's own time zone; null means "use the workspace's". */
  timeZone: string | null;
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
    timeZone: readOptionalString(data, "timeZone"),
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
    timeZone: member.timeZone,
    invitedBy: member.invitedBy,
    invitedAt: fromDate(member.invitedAt),
    joinedAt: fromDate(member.joinedAt),
    lastActiveAt: fromDate(member.lastActiveAt),
  };
}

export const memberConverter = createConverter({ parse, serialize });
export const parseMember = parse;
export const serializeMember = serialize;
