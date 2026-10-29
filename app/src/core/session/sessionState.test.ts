// File : /TeamSamsara.Workflow/app/src/core/session/sessionState.test.ts
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Tests every combination of sign-in account and member record.

import { describe, expect, it } from "vitest";
import type { LiveResult, MemberRecord } from "@/core/data";
import { deriveSessionState } from "./sessionState";

const user = { id: "uid-1", email: "sam@example.com" };

const member: MemberRecord = {
  id: "uid-1",
  displayName: "Sam",
  email: "sam@example.com",
  status: "active",
  roleIds: [],
  workGroupIds: [],
  timeZone: null,
  invitedBy: null,
  invitedAt: null,
  joinedAt: null,
  lastActiveAt: null,
};

const ready = (data: MemberRecord | null): LiveResult<MemberRecord | null> => ({
  status: "ready",
  data,
  error: null,
});
const loading: LiveResult<MemberRecord | null> = {
  status: "loading",
  data: undefined,
  error: null,
};

describe("deriveSessionState", () => {
  it("waits while Firebase checks the sign-in", () => {
    expect(deriveSessionState(undefined, loading)).toEqual({
      status: "loading",
    });
  });

  it("is signed out with no account", () => {
    expect(deriveSessionState(null, loading)).toEqual({ status: "signedOut" });
  });

  it("waits for the member record once signed in", () => {
    expect(deriveSessionState(user, loading)).toEqual({ status: "loading" });
  });

  it("lets an active member in", () => {
    expect(deriveSessionState(user, ready(member))).toEqual({
      status: "active",
      user,
      member,
    });
  });

  it("lets an invited member in, so their first sign-in can activate them", () => {
    const invited = { ...member, status: "invited" as const };
    expect(deriveSessionState(user, ready(invited)).status).toBe("active");
  });

  it("keeps out an account with no member record", () => {
    expect(deriveSessionState(user, ready(null))).toEqual({
      status: "noAccess",
      user,
      reason: "noRecord",
    });
  });

  it("keeps out a disabled member", () => {
    const disabled = { ...member, status: "disabled" as const };
    expect(deriveSessionState(user, ready(disabled))).toEqual({
      status: "noAccess",
      user,
      reason: "disabled",
    });
  });

  it("treats a removed member as having no record", () => {
    const removed = { ...member, status: "removed" as const };
    expect(deriveSessionState(user, ready(removed))).toEqual({
      status: "noAccess",
      user,
      reason: "noRecord",
    });
  });

  it("reports when the record cannot be read", () => {
    expect(
      deriveSessionState(user, {
        status: "error",
        data: undefined,
        error: "offline",
      }),
    ).toEqual({ status: "error", user });
  });
});
