// File : /TeamSamsara.Workflow/scripts/seedEmulator.mjs
// Version : 1.1.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Fills the local emulators with a ready-made workspace and test
// accounts, so the app can be tried without touching the real project. It wipes
// the emulators first. Run it while `npm run emulators` is running: npm run seed

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

// #region Settings
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const firebaseConfig = JSON.parse(
  readFileSync(path.join(repoRoot, "firebase.json"), "utf8"),
);
const firebaseProjects = JSON.parse(
  readFileSync(path.join(repoRoot, ".firebaserc"), "utf8"),
);

// `firebase emulators:exec` sets GCLOUD_PROJECT; otherwise use the project the app points at.
const projectId =
  process.env.GCLOUD_PROJECT ?? firebaseProjects.projects.default;
const authEmulator = `http://${firebaseConfig.emulators.auth.host}:${firebaseConfig.emulators.auth.port}`;
const firestoreEmulator = firebaseConfig.emulators.firestore;

/** Every seeded account uses this password. Emulator only: never a real one. */
const devPassword = "Workflow-dev-1";
// #endregion

// #region Seed data
const everyoneRole = {
  id: "everyone",
  name: "Everyone",
  color: "#8A8F94",
  description: "Every member has this role.",
  position: 0,
  permissions: ["viewAll", "doAssignedTasks"],
};

const adminRole = {
  id: "admin",
  name: "Admin",
  color: "#E5484D",
  description: "Can do everything.",
  position: 2,
  permissions: ["administrator"],
};

/** A role with only some workspace settings, to try a partial Settings area. */
const peopleManagerRole = {
  id: "peopleManager",
  name: "People manager",
  color: "#3E8ED0",
  description: "Invites members and arranges work groups.",
  position: 1,
  permissions: ["manageMembers", "manageWorkGroups"],
};

/** status null = an account with no member record (never invited). */
const accounts = [
  {
    key: "alex",
    name: "Alex Moreau",
    status: "active",
    roleIds: ["admin"],
    note: "Admin",
  },
  {
    key: "jordan",
    name: "Jordan Blake",
    status: "active",
    roleIds: ["peopleManager"],
    note: "People manager: Members and Work groups settings only",
  },
  {
    key: "sam",
    name: "Sam Rivera",
    status: "active",
    roleIds: [],
    note: "Member, Everyone role only",
  },
  {
    key: "mika",
    name: "Mika Tanaka",
    status: "invited",
    roleIds: [],
    note: "Invited, becomes active on first sign-in",
  },
  {
    key: "chris",
    name: "Chris Novak",
    status: "disabled",
    roleIds: [],
    note: "Access turned off",
  },
  {
    key: "stranger",
    name: "Stranger",
    status: null,
    roleIds: [],
    note: "Signed up without an invite",
  },
];
// #endregion

// #region Helpers
function emailFor(key) {
  return `${key}@example.test`;
}

/** Same index the app builds: permission key -> ids of the roles that grant it. */
function buildPermissionGrants(roles) {
  const grants = {};
  for (const role of [...roles].sort((a, b) => a.id.localeCompare(b.id))) {
    for (const permission of new Set(role.permissions)) {
      (grants[permission] ??= []).push(role.id);
    }
  }
  return grants;
}

async function authRequest(method, route, body) {
  const response = await fetch(`${authEmulator}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer owner",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(
      `Auth emulator ${method} ${route} failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

function createAccount(account) {
  return authRequest(
    "POST",
    "/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator",
    {
      email: emailFor(account.key),
      password: devPassword,
      displayName: account.name,
    },
  );
}
// #endregion

async function main() {
  console.log(`Seeding the emulators for project "${projectId}"...`);

  await authRequest("DELETE", `/emulator/v1/projects/${projectId}/accounts`);
  const created = [];
  for (const account of accounts) {
    const { localId } = await createAccount(account);
    created.push({ ...account, uid: localId });
  }

  const env = await initializeTestEnvironment({
    projectId,
    firestore: { host: firestoreEmulator.host, port: firestoreEmulator.port },
  });
  await env.clearFirestore();

  const now = new Date();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const roles = [everyoneRole, adminRole, peopleManagerRole];
    const writes = [
      db.doc("config/workspace").set({
        name: "Team Samsara (dev)",
        timeZone: "America/Toronto",
        weekStartsOn: "monday",
        timeFormat: "12h",
        defaultTheme: "device",
        enabledPlatformIds: [],
        createdAt: now,
      }),
      db.doc("config/roles").set({
        roles: Object.fromEntries(roles.map(({ id, ...role }) => [id, role])),
        grants: buildPermissionGrants(roles),
      }),
    ];
    for (const account of created) {
      if (account.status === null) continue;
      writes.push(
        db.doc(`members/${account.uid}`).set({
          displayName: account.name,
          email: emailFor(account.key),
          status: account.status,
          roleIds: account.roleIds,
          workGroupIds: [],
          timeZone: null,
          invitedBy: null,
          invitedAt: now,
          joinedAt: account.status === "active" ? now : null,
          lastActiveAt: null,
        }),
      );
    }
    await Promise.all(writes);
  });
  await env.cleanup();

  console.log(`\nDone. Every account's password is ${devPassword}\n`);
  console.table(
    created.map((account) => ({
      email: emailFor(account.key),
      what: account.note,
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
