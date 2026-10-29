// File : /TeamSamsara.Workflow/tests/rules/workspace.rules.test.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Tests first-time setup and the workspace record: anyone can see
// whether a workspace exists; the first one is created once, in one batch with
// the roles and its first Admin; later edits need Manage settings.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const workspaceSettings = {
  name: "Team Samsara",
  timeZone: "America/Toronto",
  weekStartsOn: "monday",
  timeFormat: "12h",
  defaultTheme: "device",
  enabledPlatformIds: [],
};

const firstRoles = {
  roles: {
    everyone: {
      name: "Everyone",
      color: "#8A8F94",
      description: "",
      position: 0,
      permissions: ["viewAll", "doAssignedTasks"],
    },
    admin: {
      name: "Admin",
      color: "#E5484D",
      description: "",
      position: 1,
      permissions: ["administrator"],
    },
  },
  grants: {
    administrator: ["admin"],
    doAssignedTasks: ["everyone"],
    viewAll: ["everyone"],
  },
};

const adminRecord = (email: string) => ({
  displayName: "Alex",
  email,
  status: "active",
  roleIds: ["admin"],
  workGroupIds: [],
  timeZone: null,
  invitedBy: null,
  invitedAt: null,
  joinedAt: serverTimestamp(),
  lastActiveAt: serverTimestamp(),
});

/** A client signed in as this account, with the email in its token. */
function signedInWithEmail(userId: string) {
  return env
    .authenticatedContext(userId, { email: `${userId}@example.test` })
    .firestore();
}

interface SetupParts {
  workspace?: Record<string, unknown> | null;
  roles?: Record<string, unknown> | null;
  member?: Record<string, unknown> | null;
}

/** The setup batch; leave a part out (null) or change it to test the rules. */
function setupBatch(db: Firestore, userId: string, parts: SetupParts = {}) {
  const batch = writeBatch(db);
  const workspace =
    parts.workspace === undefined
      ? { ...workspaceSettings, createdAt: serverTimestamp() }
      : parts.workspace;
  const roles = parts.roles === undefined ? firstRoles : parts.roles;
  const member =
    parts.member === undefined
      ? adminRecord(`${userId}@example.test`)
      : parts.member;
  if (workspace) batch.set(doc(db, "config/workspace"), workspace);
  if (roles) batch.set(doc(db, "config/roles"), roles);
  if (member) batch.set(doc(db, "members", userId), member);
  return batch.commit();
}

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe("seeing whether a workspace exists", () => {
  it("works signed out, with or without a workspace", async () => {
    await assertSucceeds(getDoc(doc(signedOut(env), "config/workspace")));
    await seed(env, { "config/workspace": workspaceSettings });
    await assertSucceeds(getDoc(doc(signedOut(env), "config/workspace")));
  });

  it("does not open the roles to visitors", async () => {
    await seed(env, { "config/roles": firstRoles });
    await assertFails(getDoc(doc(signedOut(env), "config/roles")));
    await assertFails(
      getDoc(doc(signedInWithEmail("stranger"), "config/roles")),
    );
  });
});

describe("first-time setup", () => {
  it("creates the workspace, roles and first Admin in one batch", async () => {
    await assertSucceeds(setupBatch(signedInWithEmail("alex"), "alex"));
  });

  it("needs someone signed in", async () => {
    await assertFails(
      setDoc(doc(signedOut(env), "config/workspace"), {
        ...workspaceSettings,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("can't create any of the three on its own", async () => {
    const db = signedInWithEmail("alex");
    await assertFails(setupBatch(db, "alex", { roles: null, member: null }));
    await assertFails(
      setupBatch(db, "alex", { workspace: null, member: null }),
    );
    await assertFails(setupBatch(db, "alex", { workspace: null, roles: null }));
    await assertFails(setupBatch(db, "alex", { member: null }));
  });

  it("happens only once", async () => {
    await assertSucceeds(setupBatch(signedInWithEmail("alex"), "alex"));
    await assertFails(setupBatch(signedInWithEmail("sam"), "sam"));
  });

  it("makes the person setting up an Admin, with their own email", async () => {
    const db = signedInWithEmail("alex");
    await assertFails(
      setupBatch(db, "alex", {
        member: { ...adminRecord("alex@example.test"), roleIds: [] },
      }),
    );
    await assertFails(
      setupBatch(db, "alex", {
        member: adminRecord("someone.else@example.test"),
      }),
    );
    await assertFails(
      setupBatch(db, "alex", {
        member: { ...adminRecord("alex@example.test"), status: "invited" },
      }),
    );
  });

  it("can't create someone else's member record", async () => {
    const db = signedInWithEmail("alex");
    const batch = writeBatch(db);
    batch.set(doc(db, "config/workspace"), {
      ...workspaceSettings,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "config/roles"), firstRoles);
    batch.set(doc(db, "members/sam"), adminRecord("alex@example.test"));
    await assertFails(batch.commit());
  });

  it("never gives Everyone Administrator", async () => {
    const db = signedInWithEmail("alex");
    await assertFails(
      setupBatch(db, "alex", {
        roles: {
          ...firstRoles,
          grants: {
            ...firstRoles.grants,
            administrator: ["admin", "everyone"],
          },
        },
      }),
    );
  });

  it("checks the workspace settings", async () => {
    const db = signedInWithEmail("alex");
    await assertFails(
      setupBatch(db, "alex", {
        workspace: {
          ...workspaceSettings,
          name: "",
          createdAt: serverTimestamp(),
        },
      }),
    );
    await assertFails(
      setupBatch(db, "alex", {
        workspace: {
          ...workspaceSettings,
          weekStartsOn: "friday",
          createdAt: serverTimestamp(),
        },
      }),
    );
    await assertFails(
      setupBatch(db, "alex", {
        workspace: { ...workspaceSettings, createdAt: new Date(2000, 0, 1) },
      }),
    );
  });
});

describe("changing the workspace later", () => {
  beforeEach(async () => {
    await seed(env, {
      "config/workspace": { ...workspaceSettings, createdAt: new Date() },
      "config/roles": {
        ...firstRoles,
        roles: {
          ...firstRoles.roles,
          settings: {
            name: "Settings",
            color: "#000000",
            description: "",
            position: 2,
            permissions: ["manageSettings"],
          },
        },
        grants: { ...firstRoles.grants, manageSettings: ["settings"] },
      },
      "members/alex": { status: "active", roleIds: ["admin"] },
      "members/jordan": { status: "active", roleIds: ["settings"] },
      "members/sam": { status: "active", roleIds: [] },
    });
  });

  it("is allowed with Manage settings or Administrator", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "jordan"), "config/workspace"), {
        name: "Renamed",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "alex"), "config/workspace"), {
        timeFormat: "24h",
      }),
    );
  });

  it("is not allowed for other members", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "sam"), "config/workspace"), {
        name: "Mine",
      }),
    );
  });

  it("keeps the settings valid and the creation time fixed", async () => {
    const db = signedInAs(env, "alex");
    await assertFails(updateDoc(doc(db, "config/workspace"), { name: "" }));
    await assertFails(
      updateDoc(doc(db, "config/workspace"), { createdAt: new Date() }),
    );
    await assertFails(
      updateDoc(doc(db, "config/workspace"), { somethingElse: true }),
    );
  });

  it("can't be deleted", async () => {
    await assertFails(
      deleteDoc(doc(signedInAs(env, "alex"), "config/workspace")),
    );
  });
});
