// File : /TeamSamsara.Workflow/tests/rules/platformCatalogue.rules.test.ts
// Version : 1.1.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Keeps firestore.rules and the app's platform catalogue in step: the
// platform ids the rules accept are exactly the catalogue's, in order, and the
// same goes for the platforms with a paid tier.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PlatformIds,
  PremiumPlatformIds,
} from "../../app/src/features/platforms/catalogue/platformCatalogue";

const here = path.dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(path.resolve(here, "../../firestore.rules"), "utf8");

/** The ids listed in the rules' `….hasOnly([...])` check that the pattern finds. */
function idsAllowedBy(pattern: RegExp): string[] {
  const listed = pattern.exec(rules)?.[1] ?? "";
  return [...listed.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

describe("the platform catalogue", () => {
  it("matches the platform ids firestore.rules accepts", () => {
    expect(idsAllowedBy(/enabledPlatformIds\.hasOnly\(\[([^\]]*)\]\)/)).toEqual(
      PlatformIds,
    );
  });

  it("matches the paid-tier platforms firestore.rules accepts", () => {
    expect(
      idsAllowedBy(/"premiumPlatformIds", \[\]\)\.hasOnly\(\[([^\]]*)\]\)/),
    ).toEqual(PremiumPlatformIds);
  });
});
