// File : /TeamSamsara.Workflow/app/src/core/workspace/setupService.ts
// Version : 1.2.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : First-time setup. Gets a sign-in account (the one already signed in,
// a new one, or an existing one with the right password), then writes the
// workspace, the default roles and statuses, and the person as its first Admin in one batch,
// so a half-made workspace can never exist. The security rules allow this batch
// only while there is no workspace.

import { collection, doc, writeBatch } from "firebase/firestore";
import {
  Collections,
  ConfigDocuments,
  serializeRoles,
  serializeWorkspace,
  serverTime,
} from "@/core/data";
import {
  authErrorKind,
  createAccount,
  signIn,
  type SessionUser,
} from "@/core/session";
import { db } from "@/lib/firebase";
import { AdminRoleId, defaultRoles } from "./seed/defaultRoles";
import { defaultStatuses } from "./seed/defaultStatuses";
import { workspaceRef } from "./workspaceService";
import type { WorkspaceSettings } from "./workspaceTypes";

export interface SetupAccount {
  displayName: string;
  email: string;
  password: string;
}

export interface SetupDetails {
  workspace: WorkspaceSettings;
  /** Who becomes the first Admin. */
  account: SetupAccount;
  /** Already signed in (a retry, or an account made earlier): use it instead. */
  signedInUser: SessionUser | null;
}

/** A new account, or the existing one when the email is taken and the password is its own. */
async function accountFor(details: SetupDetails): Promise<SessionUser> {
  if (details.signedInUser) return details.signedInUser;
  const { email, password } = details.account;
  try {
    return await createAccount(email, password);
  } catch (error) {
    if (authErrorKind(error) !== "emailInUse") throw error;
    try {
      return await signIn(email, password);
    } catch {
      // Report the taken email rather than a sign-in failure the person didn't ask for.
      throw error;
    }
  }
}

export async function setUpWorkspace(details: SetupDetails): Promise<void> {
  const user = await accountFor(details);
  const workspace = details.workspace;
  const batch = writeBatch(db);

  batch.set(workspaceRef(), {
    ...serializeWorkspace({
      ...workspace,
      name: workspace.name.trim(),
      createdAt: null,
    }),
    createdAt: serverTime(),
  });
  batch.set(
    doc(db, Collections.config, ConfigDocuments.roles),
    serializeRoles({ roles: [...defaultRoles], grants: {} }),
  );
  batch.set(doc(db, Collections.members, user.id), {
    displayName: details.account.displayName.trim(),
    email: user.email,
    status: "active",
    roleIds: [AdminRoleId],
    workGroupIds: [],
    timeZone: null,
    invitedBy: null,
    invitedAt: null,
    joinedAt: serverTime(),
    lastActiveAt: serverTime(),
  });

  for (const status of defaultStatuses) {
    batch.set(doc(collection(db, Collections.statuses)), status);
  }

  await batch.commit();
}
