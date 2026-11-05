// File : /TeamSamsara.Workflow/tests/rules/availability.rules.test.ts
// Version : 1.2.0
// Latest commit: fix/private-appointments
// Author : Gerrah
// Purpose : Tests availability and personal appointments against the rules:
// every member reads availability and busy times, only the member changes
// theirs; an appointment's details are for the member and for whoever they
// shared it with (never for a permission alone), and its busy copy is written
// and removed with it.

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
  query,
  serverTimestamp,
  setDoc,
  where,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: {
      name: "Everyone",
      position: 0,
      permissions: ["doAssignedTasks"],
    },
    manager: {
      name: "Manager",
      position: 1,
      permissions: ["viewAvailability"],
    },
  },
  grants: { doAssignedTasks: ["everyone"], viewAvailability: ["manager"] },
};

const week = (changes: Record<string, unknown> = {}) => ({
  weekly: { "1": [8, 9, 10, 11, 12, 13, 14], "2": [8, 9, 10] },
  exceptions: [{ date: "2026-11-14", from: null, to: null, available: false }],
  updatedAt: serverTimestamp(),
  ...changes,
});

const times = {
  startsAt: new Date("2026-11-02T20:30:00Z"),
  endsAt: new Date("2026-11-02T21:30:00Z"),
};

const personal = (memberId: string, changes: Record<string, unknown> = {}) => ({
  memberId,
  title: "Dentist",
  notes: "",
  ...times,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

/** An appointment and its busy copy, in one batch. */
function addAppointment(
  who: string,
  id: string,
  entry = personal(who),
  busy: Record<string, unknown> = { memberId: who, ...times },
) {
  const db = signedInAs(env, who);
  const batch = writeBatch(db);
  batch.set(doc(db, "personal", id), entry);
  batch.set(doc(db, "busy", id), busy);
  return batch.commit();
}

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/kai": { status: "active", roleIds: [], workGroupIds: ["bloom"] },
    "members/rin": { status: "active", roleIds: [], workGroupIds: ["bloom"] },
    "members/lara": {
      status: "active",
      roleIds: ["manager"],
      workGroupIds: [],
    },
    "members/chris": { status: "disabled", roleIds: [], workGroupIds: [] },
    "availability/rin": { ...week(), updatedAt: new Date(2026, 10, 1) },
    "personal/rinDentist": {
      ...personal("rin"),
      createdAt: new Date(2026, 10, 1),
      updatedAt: new Date(2026, 10, 1),
    },
    "busy/rinDentist": { memberId: "rin", ...times },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("availability", () => {
  it("is read by every active member", async () => {
    await assertSucceeds(
      getDoc(doc(signedInAs(env, "kai"), "availability/rin")),
    );
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "kai"), "availability")),
    );
    await assertFails(
      getDoc(doc(signedInAs(env, "chris"), "availability/rin")),
    );
    await assertFails(getDoc(doc(signedOut(env), "availability/rin")));
  });

  it("is changed by the member only", async () => {
    await assertSucceeds(
      setDoc(doc(signedInAs(env, "kai"), "availability/kai"), week()),
    );
    await assertFails(
      setDoc(doc(signedInAs(env, "kai"), "availability/rin"), week()),
    );
    await assertFails(
      setDoc(doc(signedInAs(env, "lara"), "availability/kai"), week()),
    );
  });

  it("keeps the time zone its hours are in", async () => {
    const ref = doc(signedInAs(env, "kai"), "availability/kai");
    await assertSucceeds(setDoc(ref, week({ timeZone: "Europe/Paris" })));
    await assertSucceeds(setDoc(ref, week({ timeZone: null })));
    await assertFails(setDoc(ref, week({ timeZone: 5 })));
  });

  it("needs a valid week", async () => {
    const ref = doc(signedInAs(env, "kai"), "availability/kai");
    await assertFails(setDoc(ref, week({ weekly: { "7": [8] } })));
    await assertFails(
      setDoc(ref, week({ weekly: { "1": Array(25).fill(8) } })),
    );
    await assertFails(setDoc(ref, week({ exceptions: Array(61).fill({}) })));
    await assertFails(setDoc(ref, week({ updatedAt: new Date() })));
    await assertFails(setDoc(ref, week({ note: "hi" })));
  });
});

describe("personal appointments", () => {
  it("are added together with their busy times", async () => {
    await assertSucceeds(addAppointment("kai", "kaiGym"));
  });

  it("can't be added without busy times, or with times that differ", async () => {
    const db = signedInAs(env, "kai");
    await assertFails(setDoc(doc(db, "personal/alone"), personal("kai")));
    await assertFails(
      setDoc(doc(db, "busy/alone"), { memberId: "kai", ...times }),
    );
    await assertFails(
      addAppointment("kai", "kaiOff", personal("kai"), {
        memberId: "kai",
        startsAt: times.startsAt,
        endsAt: new Date("2026-11-02T23:00:00Z"),
      }),
    );
  });

  it("are only the member's own to add", async () => {
    await assertFails(
      addAppointment("kai", "forRin", personal("rin"), {
        memberId: "rin",
        ...times,
      }),
    );
  });

  it("show their details to the member only, whatever others' permissions", async () => {
    await assertSucceeds(
      getDoc(doc(signedInAs(env, "rin"), "personal/rinDentist")),
    );
    // See everyone's availability doesn't open someone's appointments.
    await assertFails(
      getDoc(doc(signedInAs(env, "lara"), "personal/rinDentist")),
    );
    await assertFails(
      getDoc(doc(signedInAs(env, "kai"), "personal/rinDentist")),
    );
    await assertSucceeds(
      getDocs(
        query(
          collection(signedInAs(env, "rin"), "personal"),
          where("memberId", "==", "rin"),
        ),
      ),
    );
    await assertFails(getDocs(collection(signedInAs(env, "lara"), "personal")));
    await assertFails(getDocs(collection(signedInAs(env, "kai"), "personal")));
    // Asking for someone else's by their id is refused too.
    await assertFails(
      getDocs(
        query(
          collection(signedInAs(env, "kai"), "personal"),
          where("memberId", "==", "rin"),
        ),
      ),
    );
  });

  it("show their details to the people they're shared with", async () => {
    await assertSucceeds(
      addAppointment(
        "rin",
        "rinClass",
        personal("rin", { title: "Class", visibleTo: ["lara"] }),
      ),
    );
    const shared = doc(signedInAs(env, "lara"), "personal/rinClass");
    await assertSucceeds(getDoc(shared));
    await assertFails(getDoc(doc(signedInAs(env, "kai"), "personal/rinClass")));
    await assertSucceeds(
      getDocs(
        query(
          collection(signedInAs(env, "lara"), "personal"),
          where("visibleTo", "array-contains", "lara"),
        ),
      ),
    );
    // Only the owner changes it, and only the owner can take sharing away.
    await assertFails(updateDoc(shared, { title: "Changed" }));
    await assertFails(deleteDoc(shared));
  });

  it("can be shared with a few people, never with the owner", async () => {
    await assertFails(
      addAppointment("rin", "rinSelf", personal("rin", { visibleTo: ["rin"] })),
    );
    await assertFails(
      addAppointment(
        "rin",
        "rinMany",
        personal("rin", {
          visibleTo: Array.from({ length: 31 }, (_, i) => `m${i}`),
        }),
      ),
    );
    await assertFails(
      addAppointment("rin", "rinOdd", personal("rin", { visibleTo: "lara" })),
    );
  });

  it("show only busy times to everyone else", async () => {
    await assertSucceeds(getDocs(collection(signedInAs(env, "kai"), "busy")));
    await assertFails(getDocs(collection(signedInAs(env, "chris"), "busy")));
  });

  it("are removed together with their busy times, by the member", async () => {
    await assertFails(
      deleteDoc(doc(signedInAs(env, "rin"), "personal/rinDentist")),
    );
    const kai = signedInAs(env, "kai");
    const other = writeBatch(kai);
    other.delete(doc(kai, "personal/rinDentist"));
    other.delete(doc(kai, "busy/rinDentist"));
    await assertFails(other.commit());
    const db = signedInAs(env, "rin");
    const batch = writeBatch(db);
    batch.delete(doc(db, "personal/rinDentist"));
    batch.delete(doc(db, "busy/rinDentist"));
    await assertSucceeds(batch.commit());
  });
});
