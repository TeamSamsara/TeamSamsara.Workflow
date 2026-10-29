// File : /TeamSamsara.Workflow/tests/rules/workspaceSettings.rules.test.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Tests Settings → General and Platforms against the rules: only
// Manage settings (or an Administrator) edits the workspace record; every
// setting must be one of its choices, platforms only from the catalogue; a
// workspace made before the date format existed can still be saved.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const workspace = {
  name: "Team Samsara",
  timeZone: "America/Toronto",
  weekStartsOn: "monday",
  timeFormat: "12h",
  defaultTheme: "device",
  enabledPlatformIds: ["x"],
  createdAt: new Date(2026, 0, 1),
};

const roles = {
  roles: {
    everyone: { name: "Everyone", position: 0, permissions: [] },
    settings: {
      name: "Settings",
      position: 1,
      permissions: ["manageSettings"],
    },
    admin: { name: "Admin", position: 2, permissions: ["administrator"] },
  },
  grants: { administrator: ["admin"], manageSettings: ["settings"] },
};

const settings = (as: string) => doc(signedInAs(env, as), "config/workspace");

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/workspace": workspace,
    "config/roles": roles,
    "members/alex": { status: "active", roleIds: ["admin"] },
    "members/jordan": { status: "active", roleIds: ["settings"] },
    "members/sam": { status: "active", roleIds: [] },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("General", () => {
  it("is saved by Manage settings and Administrators, even on an older workspace", async () => {
    await assertSucceeds(
      updateDoc(settings("jordan"), {
        name: "Team Samsara HQ",
        timeZone: "Europe/Paris",
        weekStartsOn: "sunday",
        dateFormat: "dayMonth",
        timeFormat: "24h",
        defaultTheme: "dark",
      }),
    );
    await assertSucceeds(updateDoc(settings("alex"), { name: "Samsara" }));
  });

  it("is not saved by other members", async () => {
    await assertFails(updateDoc(settings("sam"), { name: "Mine" }));
  });

  it("keeps every setting to its choices", async () => {
    await assertFails(updateDoc(settings("jordan"), { dateFormat: "fancy" }));
    await assertFails(updateDoc(settings("jordan"), { timeFormat: "36h" }));
    await assertFails(updateDoc(settings("jordan"), { defaultTheme: "pink" }));
    await assertFails(updateDoc(settings("jordan"), { name: "" }));
    await assertFails(updateDoc(settings("jordan"), { logo: "x.png" }));
  });
});

describe("Platforms", () => {
  it("records a paid tier only for platforms that have one", async () => {
    await assertSucceeds(
      updateDoc(settings("jordan"), { upgradedPlatformIds: arrayUnion("x") }),
    );
    await assertFails(
      updateDoc(settings("jordan"), {
        upgradedPlatformIds: arrayUnion("twitch"),
      }),
    );
  });

  it("switches catalogue platforms on and off", async () => {
    await assertSucceeds(
      updateDoc(settings("jordan"), {
        enabledPlatformIds: arrayUnion("youtube"),
      }),
    );
    await assertSucceeds(
      updateDoc(settings("jordan"), { enabledPlatformIds: arrayRemove("x") }),
    );
  });

  it("refuses platforms that aren't in the catalogue, and other members", async () => {
    await assertFails(
      updateDoc(settings("jordan"), {
        enabledPlatformIds: arrayUnion("myspace"),
      }),
    );
    await assertFails(
      updateDoc(settings("sam"), { enabledPlatformIds: arrayUnion("youtube") }),
    );
  });
});
