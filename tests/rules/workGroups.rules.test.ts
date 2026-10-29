// File : /TeamSamsara.Workflow/tests/rules/workGroups.rules.test.ts
// Version : 1.1.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Tests work groups: active members read them; only Manage work
// groups (or an Administrator) creates, edits and deletes them, with valid
// fields and the server's creation time; leads must be in the group and able
// to approve or reassign tasks; links are named https addresses.

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
    reviewer: { name: "Reviewer", position: 1, permissions: ["approveTasks"] },
  },
  grants: {
    administrator: ["admin"],
    approveTasks: ["reviewer"],
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
    "members/rita": {
      status: "active",
      roleIds: ["reviewer"],
      workGroupIds: ["design"],
    },
    "members/otto": {
      status: "active",
      roleIds: ["reviewer"],
      workGroupIds: [],
    },
    "members/dora": { status: "active", roleIds: [], workGroupIds: ["design"] },
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

describe("leads and links", () => {
  const design = (as: string) => doc(signedInAs(env, as), "workGroups/design");

  it("accepts a lead who is in the group and can approve or reassign", async () => {
    await assertSucceeds(updateDoc(design("jordan"), { leadIds: ["rita"] }));
  });

  it("refuses a lead outside the group, or without the permission", async () => {
    await assertFails(updateDoc(design("jordan"), { leadIds: ["otto"] }));
    await assertFails(updateDoc(design("jordan"), { leadIds: ["dora"] }));
    await assertFails(updateDoc(design("jordan"), { leadIds: ["nobody"] }));
  });

  it("caps leads at 5", async () => {
    await assertFails(
      updateDoc(design("jordan"), {
        leadIds: ["rita", "rita", "rita", "rita", "rita", "rita"],
      }),
    );
  });

  it("accepts named https links, up to 10", async () => {
    await assertSucceeds(
      updateDoc(design("jordan"), {
        links: [{ label: "Shared drive", url: "https://drive.google.com/x" }],
      }),
    );
    const many = Array.from({ length: 11 }, (_, index) => ({
      label: `Link ${index}`,
      url: "https://example.com",
    }));
    await assertFails(updateDoc(design("jordan"), { links: many }));
  });

  it("refuses links without a name, or not https", async () => {
    await assertFails(
      updateDoc(design("jordan"), {
        links: [{ label: "", url: "https://example.com" }],
      }),
    );
    await assertFails(
      updateDoc(design("jordan"), {
        links: [{ label: "Old", url: "http://example.com" }],
      }),
    );
    await assertFails(
      updateDoc(design("jordan"), {
        links: [{ label: "Bad", url: "javascript:alert(1)" }],
      }),
    );
  });
});
