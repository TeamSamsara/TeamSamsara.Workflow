// File : /TeamSamsara.Workflow/tests/rules/notifications.rules.test.ts
// Version : 1.1.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Tests notifications against the rules: each person reads, marks
// read and clears their own, nobody writes one from the app (the server
// functions do), and each person keeps their own notification settings.

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
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const note = (memberId: string) => ({
  memberId,
  kind: "taskGiven",
  actorId: "jo",
  title: "Thumbnail",
  detail: null,
  taskId: "t1",
  eventId: null,
  groupId: null,
  createdAt: new Date(2026, 10, 2),
  readAt: null,
});

const settings = (changes: Record<string, unknown> = {}) => ({
  app: { given: true, mine: true, review: true, events: true, news: true },
  email: {
    given: false,
    mine: false,
    review: true,
    events: false,
    news: false,
  },
  taskReminder: "2h",
  eventReminder: "1h",
  updatedAt: serverTimestamp(),
  ...changes,
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": { roles: {}, grants: {} },
    "members/sam": { status: "active", roleIds: [], workGroupIds: [] },
    "members/kai": { status: "active", roleIds: [], workGroupIds: [] },
    "notifications/n1": note("sam"),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("notifications", () => {
  it("lets someone read their own, as a list and one by one", async () => {
    const sam = signedInAs(env, "sam");
    await assertSucceeds(getDoc(doc(sam, "notifications/n1")));
    await assertSucceeds(
      getDocs(
        query(
          collection(sam, "notifications"),
          where("memberId", "==", "sam"),
          orderBy("createdAt", "desc"),
        ),
      ),
    );
  });

  it("keeps others' notifications from them", async () => {
    const kai = signedInAs(env, "kai");
    await assertFails(getDoc(doc(kai, "notifications/n1")));
    await assertFails(getDocs(collection(kai, "notifications")));
    await assertFails(deleteDoc(doc(kai, "notifications/n1")));
  });

  it("lets someone mark their own read or clear it, and nothing else", async () => {
    const sam = signedInAs(env, "sam");
    await assertSucceeds(
      updateDoc(doc(sam, "notifications/n1"), { readAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(sam, "notifications/n1"), { title: "Something else" }),
    );
    await assertSucceeds(deleteDoc(doc(sam, "notifications/n1")));
  });

  it("doesn't let the app write notifications", async () => {
    await assertFails(
      addDoc(collection(signedInAs(env, "kai"), "notifications"), note("sam")),
    );
    await assertFails(
      addDoc(collection(signedInAs(env, "sam"), "notifications"), note("sam")),
    );
  });
});

describe("notification settings", () => {
  it("lets someone keep their own", async () => {
    const sam = signedInAs(env, "sam");
    await assertSucceeds(
      setDoc(doc(sam, "notificationSettings/sam"), settings()),
    );
    await assertSucceeds(getDoc(doc(sam, "notificationSettings/sam")));
  });

  it("refuses odd values and other people's", async () => {
    const sam = signedInAs(env, "sam");
    await assertFails(
      setDoc(
        doc(sam, "notificationSettings/sam"),
        settings({ taskReminder: "5m" }),
      ),
    );
    await assertFails(
      setDoc(
        doc(sam, "notificationSettings/sam"),
        settings({
          app: { given: "yes", mine: true, review: true, events: true },
        }),
      ),
    );
    await assertFails(setDoc(doc(sam, "notificationSettings/kai"), settings()));
    await assertFails(
      getDoc(doc(signedInAs(env, "kai"), "notificationSettings/sam")),
    );
  });

  it("keeps the reminder log out of reach", async () => {
    await assertFails(getDoc(doc(signedInAs(env, "sam"), "sentReminders/x")));
  });
});
