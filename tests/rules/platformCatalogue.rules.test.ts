// File : /TeamSamsara.Workflow/tests/rules/platformCatalogue.rules.test.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Keeps firestore.rules and the app's platform catalogue in step: the
// platform ids (and paid-tier ids) the rules accept are exactly the catalogue's.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PlatformIds,
  UpgradablePlatformIds,
} from "../../app/src/features/platforms/catalogue/platformCatalogue";

const here = path.dirname(fileURLToPath(import.meta.url));

function listedIn(rules: string, field: string): string[] {
  const pattern = new RegExp(
    `${field}"?(?:, \\[\\])?\\)?\\.hasOnly\\(\\[([^\\]]*)\\]\\)`,
  );
  const listed = pattern.exec(rules)?.[1] ?? "";
  return [...listed.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

describe("the platform catalogue", () => {
  const rules = readFileSync(
    path.resolve(here, "../../firestore.rules"),
    "utf8",
  );

  it("matches the platform ids firestore.rules accepts", () => {
    expect(listedIn(rules, "enabledPlatformIds")).toEqual(PlatformIds);
  });

  it("matches the paid-tier platform ids firestore.rules accepts", () => {
    expect(listedIn(rules, "upgradedPlatformIds")).toEqual(
      UpgradablePlatformIds,
    );
  });
});
