// File : /TeamSamsara.Workflow/tests/rules/peopleTags.rules.test.ts
// Version : 1.1.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Tests people tags against the rules: everyone reads them; Tag
// people or Manage members makes, changes and deletes them and puts them on
// members; each member saves only their own Team availability view.

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
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: { name: "Everyone", position: 0, permissions: [] },
    tagger: { name: "Tagger", position: 1, permissions: ["tagPeople"] },
    manager: { name: "Manager", position: 2, permissions: ["manageMembers"] },
  },
  grants: { tagPeople: ["tagger"], manageMembers: ["manager"] },
};

const member = (roleIds: string[]) => ({
  status: "active",
  displayName: "Someone",
  email: "someone@example.test",
  roleIds,
  workGroupIds: [],
});

const tag = (changes: Record<string, unknown> = {}) => ({
  name: "Starter",
  color: "#95ff50",
  position: 0,
  ...changes,
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/okami": member([]),
    "members/kappa": member(["tagger"]),
    "members/david": member(["manager"]),
    "members/chris": { ...member([]), status: "disabled" },
    "peopleTags/starter": tag(),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("people tags", () => {
  it("are read by active members", async () => {
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "okami"), "peopleTags")),
    );
    await assertFails(
      getDocs(collection(signedInAs(env, "chris"), "peopleTags")),
    );
  });

  it("are made, changed and deleted by Tag people or Manage members", async () => {
    for (const who of ["kappa", "david"]) {
      const db = signedInAs(env, who);
      await assertSucceeds(addDoc(collection(db, "peopleTags"), tag()));
    }
    const kappa = signedInAs(env, "kappa");
    await assertSucceeds(
      updateDoc(doc(kappa, "peopleTags/starter"), { name: "Starters" }),
    );
    await assertSucceeds(deleteDoc(doc(kappa, "peopleTags/starter")));
  });

  it("are not for other members, and need valid fields", async () => {
    const okami = signedInAs(env, "okami");
    await assertFails(addDoc(collection(okami, "peopleTags"), tag()));
    await assertFails(deleteDoc(doc(okami, "peopleTags/starter")));
    const kappa = collection(signedInAs(env, "kappa"), "peopleTags");
    await assertFails(addDoc(kappa, tag({ name: "" })));
    await assertFails(addDoc(kappa, tag({ extra: true })));
    await assertFails(addDoc(kappa, tag({ position: "first" })));
  });
});

describe("tags on members", () => {
  it("are put on by Tag people or Manage members", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "kappa"), "members/okami"), {
        tagIds: ["starter"],
      }),
    );
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "david"), "members/okami"), {
        tagIds: [],
      }),
    );
  });

  it("are not changed by anyone else, even on themselves", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "okami"), "members/okami"), {
        tagIds: ["starter"],
      }),
    );
  });

  it("only change the tags", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "kappa"), "members/okami"), {
        tagIds: ["starter"],
        roleIds: ["tagger"],
      }),
    );
  });
});

describe("the newest release a member has seen", () => {
  it("is saved by the member, beside their Team availability view", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "okami"), "members/okami"), {
        "prefs.lastSeenRelease": "1.2.0",
      }),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "kappa"), "members/okami"), {
        "prefs.lastSeenRelease": "1.3.0",
      }),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "okami"), "members/okami"), {
        "prefs.lastSeenRelease": 12,
      }),
    );
  });
});

describe("a member's Team availability view", () => {
  const view = {
    prefs: { teamView: { hidden: ["david"], order: ["okami"], zone: "mine" } },
  };

  it("is saved by the member for themselves", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "okami"), "members/okami"), view),
    );
  });

  it("isn't saved for someone else, or with odd values", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "kappa"), "members/okami"), view),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "okami"), "members/okami"), {
        prefs: { teamView: { zone: "moon" } },
      }),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "okami"), "members/okami"), {
        prefs: { other: true },
      }),
    );
  });
});
