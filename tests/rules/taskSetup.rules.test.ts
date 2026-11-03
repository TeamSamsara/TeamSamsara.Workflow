// File : /TeamSamsara.Workflow/tests/rules/taskSetup.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Tests Settings → Tasks and events against the rules: active
// members read the statuses, event types and tags; only Manage settings (or an
// Administrator) adds, edits, reorders and deletes them, with valid fields.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: { name: "Everyone", position: 0, permissions: ["viewAll"] },
    settings: {
      name: "Settings",
      position: 1,
      permissions: ["manageSettings"],
    },
    admin: { name: "Admin", position: 2, permissions: ["administrator"] },
  },
  grants: {
    administrator: ["admin"],
    manageSettings: ["settings"],
    viewAll: ["everyone"],
  },
};

const status = {
  name: "To do",
  tone: "neutral",
  category: "open",
  position: 0,
};
const tag = { name: "Sponsor", color: "#3366ff", position: 0 };

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/alex": { status: "active", roleIds: ["admin"] },
    "members/jordan": { status: "active", roleIds: ["settings"] },
    "members/sam": { status: "active", roleIds: [] },
    "members/chris": { status: "disabled", roleIds: ["settings"] },
    "statuses/todo": status,
    "statuses/done": {
      ...status,
      name: "Done",
      category: "finished",
      position: 1,
    },
    "eventTypes/stream": { name: "Livestream", color: "#aa0000", position: 0 },
    "tags/sponsor": tag,
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("reading the lists", () => {
  it("is open to active members", async () => {
    const db = signedInAs(env, "sam");
    await assertSucceeds(getDocs(collection(db, "statuses")));
    await assertSucceeds(getDocs(collection(db, "eventTypes")));
    await assertSucceeds(getDocs(collection(db, "tags")));
  });

  it("is closed to disabled members and visitors", async () => {
    await assertFails(getDocs(collection(signedInAs(env, "chris"), "tags")));
    await assertFails(getDocs(collection(signedOut(env), "statuses")));
  });
});

describe("statuses", () => {
  it("are added, edited and deleted by Manage settings and Administrators", async () => {
    const db = signedInAs(env, "jordan");
    await assertSucceeds(
      addDoc(collection(db, "statuses"), {
        name: "In review",
        tone: "info",
        category: "awaitingApproval",
        position: 2,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "statuses/todo"), { name: "Planned", tone: "alert" }),
    );
    await assertSucceeds(
      deleteDoc(doc(signedInAs(env, "alex"), "statuses/todo")),
    );
  });

  it("are not changed by other members", async () => {
    const db = signedInAs(env, "sam");
    await assertFails(addDoc(collection(db, "statuses"), status));
    await assertFails(updateDoc(doc(db, "statuses/todo"), { name: "Mine" }));
    await assertFails(deleteDoc(doc(db, "statuses/todo")));
    await assertFails(
      updateDoc(doc(signedInAs(env, "chris"), "statuses/todo"), { name: "X" }),
    );
  });

  it("need a known colour and category, a name and nothing extra", async () => {
    const db = signedInAs(env, "jordan");
    const statuses = collection(db, "statuses");
    await assertFails(addDoc(statuses, { ...status, tone: "pink" }));
    await assertFails(addDoc(statuses, { ...status, category: "paused" }));
    await assertFails(addDoc(statuses, { ...status, name: "" }));
    await assertFails(addDoc(statuses, { ...status, name: "x".repeat(81) }));
    await assertFails(addDoc(statuses, { ...status, position: "first" }));
    await assertFails(addDoc(statuses, { ...status, colour: "#ffffff" }));
    const { position: _position, ...withoutPosition } = status;
    await assertFails(addDoc(statuses, withoutPosition));
  });

  it("can be reordered in one batch", async () => {
    const db = signedInAs(env, "jordan");
    const batch = writeBatch(db);
    batch.update(doc(db, "statuses/todo"), { position: 1 });
    batch.update(doc(db, "statuses/done"), { position: 0 });
    await assertSucceeds(batch.commit());
  });
});

describe("event types and tags", () => {
  it("are added, edited and deleted by Manage settings", async () => {
    const db = signedInAs(env, "jordan");
    await assertSucceeds(
      addDoc(collection(db, "tags"), { ...tag, name: "Collab" }),
    );
    await assertSucceeds(
      addDoc(collection(db, "eventTypes"), {
        name: "Release",
        color: "#00AA44",
        position: 1,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "tags/sponsor"), { color: "#000000" }),
    );
    await assertSucceeds(deleteDoc(doc(db, "eventTypes/stream")));
  });

  it("are not changed by other members", async () => {
    const db = signedInAs(env, "sam");
    await assertFails(addDoc(collection(db, "tags"), tag));
    await assertFails(updateDoc(doc(db, "tags/sponsor"), { name: "Mine" }));
    await assertFails(deleteDoc(doc(db, "eventTypes/stream")));
  });

  it("need a hex colour, a name and nothing extra", async () => {
    const tags = collection(signedInAs(env, "jordan"), "tags");
    await assertFails(addDoc(tags, { ...tag, color: "blue" }));
    await assertFails(addDoc(tags, { ...tag, color: "#12345" }));
    await assertFails(addDoc(tags, { ...tag, name: "" }));
    await assertFails(addDoc(tags, { ...tag, tone: "info" }));
  });
});
