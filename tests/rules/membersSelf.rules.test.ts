// File : /TeamSamsara.Workflow/tests/rules/membersSelf.rules.test.ts
// Version : 1.4.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Tests what a member may do with their own record: read it, become
// active on their first sign-in, note when they were last active, and change
// their own name, in-game name, time zone and formats. Nothing else, and never
// on someone else's record.

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
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const baseMember = {
  displayName: "",
  email: "",
  roleIds: [],
  workGroupIds: [],
  timeZone: null,
  invitedBy: null,
  invitedAt: null,
  joinedAt: null,
  lastActiveAt: null,
};

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "members/sam": {
      ...baseMember,
      email: "sam@example.com",
      status: "active",
    },
    "members/mika": {
      ...baseMember,
      email: "mika@example.com",
      status: "invited",
    },
    "members/chris": {
      ...baseMember,
      email: "chris@example.com",
      status: "disabled",
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

const memberDoc = (asUser: string, memberId: string) =>
  doc(signedInAs(env, asUser), "members", memberId);

describe("reading member records", () => {
  it("lets a member read their own record", async () => {
    await assertSucceeds(getDoc(memberDoc("sam", "sam")));
  });

  it("lets an account read its own missing record (to learn it has no access)", async () => {
    await assertSucceeds(getDoc(memberDoc("stranger", "stranger")));
  });

  // Active members reading everyone's record is covered in access.rules.test.ts.
  it("does not let a disabled member or a stranger read someone else's record", async () => {
    await assertFails(getDoc(memberDoc("chris", "sam")));
    await assertFails(getDoc(memberDoc("stranger", "sam")));
  });

  it("does not let anyone signed out read a record", async () => {
    await assertFails(getDoc(doc(signedOut(env), "members", "sam")));
  });
});

describe("activating on first sign-in", () => {
  it("lets an invited member become active with the server's time", async () => {
    await assertSucceeds(
      updateDoc(memberDoc("mika", "mika"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("refuses activation that also changes roles", async () => {
    await assertFails(
      updateDoc(memberDoc("mika", "mika"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        roleIds: ["admin"],
      }),
    );
  });

  it("refuses activation with a made-up time", async () => {
    await assertFails(
      updateDoc(memberDoc("mika", "mika"), {
        status: "active",
        joinedAt: new Date("2020-01-01"),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("does not let a disabled member turn themselves back on", async () => {
    await assertFails(
      updateDoc(memberDoc("chris", "chris"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("does not let a member activate someone else", async () => {
    await assertFails(
      updateDoc(memberDoc("sam", "mika"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });
});

describe("recording last activity", () => {
  it("lets an active member record when they were last active", async () => {
    await assertSucceeds(
      updateDoc(memberDoc("sam", "sam"), { lastActiveAt: serverTimestamp() }),
    );
  });

  it("refuses it for a disabled member", async () => {
    await assertFails(
      updateDoc(memberDoc("chris", "chris"), {
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("refuses changing anything else along with it", async () => {
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        lastActiveAt: serverTimestamp(),
        displayName: "Boss",
      }),
    );
  });
});

describe("changing your own settings", () => {
  it("lets an active member change their name, in-game name, time zone and formats", async () => {
    await assertSucceeds(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam Rivera",
        gameName: "Rivi",
        timeZone: "Europe/Paris",
        dateFormat: "dayMonth",
        timeFormat: "24h",
      }),
    );
    await assertSucceeds(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam Rivera",
        gameName: null,
        timeZone: null,
        dateFormat: null,
        timeFormat: null,
      }),
    );
  });

  it("refuses settings that don't fit", async () => {
    await assertFails(updateDoc(memberDoc("sam", "sam"), { displayName: "" }));
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam",
        gameName: "x".repeat(41),
      }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam",
        dateFormat: "yearFirst",
      }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam",
        timeFormat: 12,
      }),
    );
  });

  it("refuses roles, groups or email with them", async () => {
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam",
        roleIds: ["admin"],
      }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        displayName: "Sam",
        email: "boss@example.com",
      }),
    );
  });

  it("refuses them for a disabled member or on someone else's record", async () => {
    await assertFails(
      updateDoc(memberDoc("chris", "chris"), { displayName: "Chris" }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "mika"), { displayName: "Mika" }),
    );
  });
});

describe("profile photos", () => {
  const photo =
    "https://firebasestorage.googleapis.com/v0/b/demo/o/members%2Fsam%2F1.webp?alt=media&token=t";

  it("lets an active member set and clear their own photo", async () => {
    const me = doc(signedInAs(env, "sam"), "members/sam");
    await assertSucceeds(updateDoc(me, { photoUrl: photo }));
    await assertSucceeds(updateDoc(me, { photoUrl: null }));
  });

  it("refuses photos from elsewhere and on someone else's record", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "sam"), "members/sam"), {
        photoUrl: "https://example.com/me.png",
      }),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "sam"), "members/chris"), {
        photoUrl: null,
      }),
    );
  });

  it("lets an Administrator take down someone's photo, and nothing else", async () => {
    await seed(env, {
      "config/roles": {
        roles: {},
        grants: { administrator: ["admin"] },
      },
      "members/alex": {
        ...baseMember,
        status: "active",
        roleIds: ["admin"],
      },
      "members/sam": {
        ...baseMember,
        email: "sam@example.com",
        status: "active",
        photoUrl: photo,
      },
    });
    const sam = doc(signedInAs(env, "alex"), "members/sam");
    await assertFails(updateDoc(sam, { photoUrl: photo + "x" }));
    await assertSucceeds(updateDoc(sam, { photoUrl: null }));
  });
});

describe("recording the walkthrough", () => {
  it("lets an active member record the chapters they've done", async () => {
    await assertSucceeds(
      updateDoc(memberDoc("sam", "sam"), {
        walkthrough: { done: ["gettingAround", "myTasks"], hidden: false },
      }),
    );
  });

  it("refuses odd shapes, other fields with it, and other people", async () => {
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        walkthrough: { done: "all", hidden: false },
      }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        walkthrough: { done: [], hidden: false, admin: true },
      }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        walkthrough: { done: [], hidden: true },
        roleIds: ["admin"],
      }),
    );
    await assertFails(
      updateDoc(memberDoc("sam", "mika"), {
        walkthrough: { done: [], hidden: true },
      }),
    );
    await assertFails(
      updateDoc(memberDoc("chris", "chris"), {
        walkthrough: { done: [], hidden: true },
      }),
    );
  });
});

describe("other writes", () => {
  it("does not let anyone create their own record", async () => {
    await assertFails(
      setDoc(memberDoc("stranger", "stranger"), {
        ...baseMember,
        status: "active",
      }),
    );
  });

  it("does not let a member delete their record", async () => {
    await assertFails(deleteDoc(memberDoc("sam", "sam")));
  });
});
