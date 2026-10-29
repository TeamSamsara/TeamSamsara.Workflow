// File : /TeamSamsara.Workflow/tests/rules/base.rules.test.ts
// Version : 1.2.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Proves the starting point of the rules: nothing can be read or
// written, signed in or not, until a later rule allows it.

import { assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/workspace": { name: "Test workspace" },
    "members/alex": { displayName: "Alex", status: "active" },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("base rules", () => {
  it("deny reads when signed out", async () => {
    await assertFails(signedOut(env).doc("config/workspace").get());
  });

  it("deny reads of anything not opened by a later rule", async () => {
    await assertFails(signedInAs(env, "alex").doc("tasks/any").get());
    await assertFails(signedInAs(env, "alex").doc("somethingNew/any").get());
  });

  it("deny writes of anything not opened by a later rule", async () => {
    const db = signedInAs(env, "alex");
    await assertFails(db.doc("config/workspace").update({ name: "Mine" }));
    await assertFails(db.doc("tasks/new").set({ title: "Sneaky" }));
  });
});
