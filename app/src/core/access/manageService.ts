// File : /TeamSamsara.Workflow/app/src/core/access/manageService.ts
// Version : 1.2.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : Protected changes go through the server, which checks rank and
// records them in the activity history: a member's name, roles, groups and
// access, removing or inviting someone, saving the roles, a group's leads
// and how it hands out tasks, and the Owner role. The database refuses these from the app directly. The
// server's refusal reason comes back as the error's message.

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export interface RoleToSave {
  id: string;
  name: string;
  color: string;
  description: string;
  position: number;
  permissions: string[];
}

export type ManageOp =
  | {
      op: "member.update";
      memberId: string;
      displayName?: string;
      roleIds?: string[];
      workGroupIds?: string[];
      /** Their usual week in tasks; null to follow the workspace's. */
      usualWeek?: number | null;
    }
  | { op: "member.access"; memberId: string; on: boolean }
  | { op: "member.remove"; memberId: string }
  | {
      op: "member.invite";
      email: string;
      roleIds: string[];
      workGroupIds: string[];
    }
  | { op: "roles.save"; roles: RoleToSave[]; version: number }
  | { op: "group.leads"; groupId: string; leadIds: string[] }
  | {
      op: "group.assign";
      groupId: string;
      on?: boolean;
      headsUpHours?: number;
      skip?: string[];
      /** The group's usual week in tasks; null for none. */
      usualWeek?: number | null;
    }
  | { op: "owner.give"; memberId: string }
  | { op: "owner.stepDown" };

/** Why the server said no: a reason from the shared access rules, or the change's own. */
export type ManageRefusal =
  | "notBelow"
  | "outranked"
  | "missingPermission"
  | "protectedRole"
  | "ownerOnly"
  | "lastOwner"
  | "notFound"
  | "invalid"
  | "stale"
  | "alreadyMember"
  | "noAccess";

export async function manage(op: ManageOp): Promise<void> {
  await httpsCallable<ManageOp, { done: boolean }>(functions, "manage")(op);
}

/** The reason in a refusal from manage(), when it's one we know. */
export function manageRefusal(error: unknown): ManageRefusal | null {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const known: ManageRefusal[] = [
    "notBelow",
    "outranked",
    "missingPermission",
    "protectedRole",
    "ownerOnly",
    "lastOwner",
    "notFound",
    "invalid",
    "stale",
    "alreadyMember",
    "noAccess",
  ];
  return known.find((reason) => message === reason) ?? null;
}
