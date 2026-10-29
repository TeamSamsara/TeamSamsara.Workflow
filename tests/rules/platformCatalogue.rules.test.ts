// File : /TeamSamsara.Workflow/tests/rules/platformCatalogue.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Keeps firestore.rules and the app's platform catalogue in step: the
// platform ids the rules accept are exactly the catalogue's, in order.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PlatformIds } from "../../app/src/features/platforms/catalogue/platformCatalogue";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("the platform catalogue", () => {
  it("matches the platform ids firestore.rules accepts", () => {
    const rules = readFileSync(
      path.resolve(here, "../../firestore.rules"),
      "utf8",
    );
    const listed =
      /enabledPlatformIds\.hasOnly\(\[([^\]]*)\]\)/.exec(rules)?.[1] ?? "";
    const ids = [...listed.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toEqual(PlatformIds);
  });
});
