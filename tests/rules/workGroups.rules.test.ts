// File : /TeamSamsara.Workflow/tests/rules/workGroups.rules.test.ts
// Version : 2.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests work groups: active members read them; only Manage work
// groups (or an Administrator) creates, edits and deletes them, with valid
// fields and the server's creation time. Leads, and how a group hands out
// its tasks, are set by the server.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: { name: "Everyone", position: 0, permissions: ["viewAll"] },
    organiser: {
      name: "Organiser",
      position: 1,
      permissions: ["manageWorkGroups"],
    },
    admin: { name: "Admin", position: 2, permissions: ["administrator"] },
  },
  grants: {
    administrator: ["admin"],
    manageWorkGroups: ["organiser"],
    viewAll: ["everyone"],
  },
};

const newGroup = (name = "Video") => ({
  name,
  description: "Edits highlights.",
  createdAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/alex": { status: "active", roleIds: ["admin"] },
    "members/jordan": { status: "active", roleIds: ["organiser"] },
    "members/sam": { status: "active", roleIds: [] },
    "members/chris": { status: "disabled", roleIds: ["organiser"] },
    "workGroups/design": {
      name: "Design",
      description: "",
      createdAt: new Date(2026, 0, 1),
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("reading work groups", () => {
  it("is open to active members", async () => {
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "sam"), "workGroups")),
    );
  });

  it("is closed to disabled members and visitors", async () => {
    await assertFails(
      getDoc(doc(signedInAs(env, "chris"), "workGroups/design")),
    );
    await assertFails(getDoc(doc(signedOut(env), "workGroups/design")));
  });
});

describe("leads and links", () => {
  it("lets Manage work groups change links; leads are the server's to set", async () => {
    const db = signedInAs(env, "jordan");
    await assertSucceeds(
      updateDoc(doc(db, "workGroups/design"), {
        links: [{ label: "Shared drive", url: "https://drive.google.com/x" }],
      }),
    );
    await assertFails(
      updateDoc(doc(db, "workGroups/design"), { leadIds: ["alex"] }),
    );
  });

  it("leaves how it hands out tasks to the server, kept on every edit", async () => {
    const db = signedInAs(env, "jordan");
    await assertFails(
      updateDoc(doc(db, "workGroups/design"), {
        assign: { on: true, dailyLimit: 3, headsUpHours: 24, skip: [] },
      }),
    );
    await assertFails(
      setDoc(doc(db, "workGroups/video"), {
        ...newGroup(),
        assign: { on: true, dailyLimit: 3, headsUpHours: 24, skip: [] },
      }),
    );
    await seed(env, {
      "workGroups/handing": {
        name: "Handing",
        description: "",
        createdAt: new Date(2026, 0, 1),
        assign: { on: true, dailyLimit: 3, headsUpHours: 24, skip: [] },
      },
    });
    await assertSucceeds(
      updateDoc(doc(db, "workGroups/handing"), { description: "Still on." }),
    );
  });

  it("caps links at ten, as a list", async () => {
    const db = signedInAs(env, "jordan");
    await assertFails(
      updateDoc(doc(db, "workGroups/design"), { links: "https://x.com" }),
    );
  });
});

describe("changing work groups", () => {
  it("lets Manage work groups and Administrators create, edit and delete", async () => {
    await assertSucceeds(
      setDoc(doc(signedInAs(env, "jordan"), "workGroups/video"), newGroup()),
    );
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "alex"), "workGroups/design"), {
        name: "Brand",
      }),
    );
    await assertSucceeds(
      deleteDoc(doc(signedInAs(env, "jordan"), "workGroups/design")),
    );
  });

  it("refuses other members, and disabled ones", async () => {
    await assertFails(
      setDoc(doc(signedInAs(env, "sam"), "workGroups/video"), newGroup()),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "sam"), "workGroups/design"), {
        name: "Mine",
      }),
    );
    await assertFails(
      deleteDoc(doc(signedInAs(env, "sam"), "workGroups/design")),
    );
    await assertFails(
      setDoc(doc(signedInAs(env, "chris"), "workGroups/video"), newGroup()),
    );
  });

  it("checks the fields", async () => {
    const db = signedInAs(env, "jordan");
    await assertFails(setDoc(doc(db, "workGroups/a"), newGroup("")));
    await assertFails(
      setDoc(doc(db, "workGroups/b"), newGroup("x".repeat(81))),
    );
    await assertFails(
      setDoc(doc(db, "workGroups/c"), {
        ...newGroup(),
        description: "x".repeat(301),
      }),
    );
    await assertFails(
      setDoc(doc(db, "workGroups/d"), { ...newGroup(), discordRole: "@video" }),
    );
    await assertFails(
      setDoc(doc(db, "workGroups/e"), {
        ...newGroup(),
        createdAt: new Date(2000, 0, 1),
      }),
    );
    await assertFails(
      updateDoc(doc(db, "workGroups/design"), { createdAt: serverTimestamp() }),
    );
  });
});
