// File : /TeamSamsara.Workflow/app/src/features/members/service/memberFilters.test.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Tests the Members page's status filter, search and counts.

import { describe, expect, it } from "vitest";
import type { MemberRecord, MemberStatus } from "@/core/data";
import type { MemberListItem } from "../types/memberTypes";
import { countByStatus, filterMembers } from "./memberFilters";

const item = (
  displayName: string,
  email: string,
  status: MemberStatus,
): MemberListItem => ({
  member: {
    id: email,
    displayName,
    email,
    status,
    roleIds: [],
    workGroupIds: [],
    timeZone: null,
    invitedBy: null,
    invitedAt: null,
    joinedAt: null,
    lastActiveAt: null,
  } satisfies MemberRecord,
  roles: [],
  groups: [],
});

const items = [
  item("Sam Rivera", "sam@example.com", "active"),
  item("Zoë Park", "zoe@example.com", "active"),
  item("", "mika@example.com", "invited"),
  item("Chris Novak", "chris@example.com", "disabled"),
];

const names = (list: MemberListItem[]) =>
  list.map((entry) => entry.member.email);

describe("filterMembers", () => {
  it("filters by status and sorts by name (email when there is none)", () => {
    expect(names(filterMembers(items, "all", ""))).toEqual([
      "chris@example.com",
      "mika@example.com",
      "sam@example.com",
      "zoe@example.com",
    ]);
    expect(names(filterMembers(items, "invited", ""))).toEqual([
      "mika@example.com",
    ]);
  });

  it("searches names and emails, ignoring case and accents", () => {
    expect(names(filterMembers(items, "all", "ZOE"))).toEqual([
      "zoe@example.com",
    ]);
    expect(names(filterMembers(items, "all", " mika@ "))).toEqual([
      "mika@example.com",
    ]);
    expect(names(filterMembers(items, "active", "chris"))).toEqual([]);
  });
});

describe("countByStatus", () => {
  it("counts every filter", () => {
    expect(countByStatus(items)).toEqual({
      all: 4,
      active: 2,
      invited: 1,
      disabled: 1,
    });
  });
});
