// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/releaseLinks.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-docs-seed
// Author : Gerrah
// Purpose : Every release note's help article and picture exists, so What's
// new never links to nothing.

import { releases } from "@releases/index";
import { describe, expect, it } from "vitest";
import { DocGroups } from "@/features/onboarding";
import { releasePictures } from "./releasePictures";

const articleIds = new Set(
  DocGroups.flatMap((group) => group.articles.map((article) => article.id)),
);

describe("release notes", () => {
  it.each(releases.flatMap((release) => release.changes))(
    "$title links to a real article and picture",
    (change) => {
      if (change.article) expect(articleIds).toContain(change.article);
      if (change.picture) expect(releasePictures[change.picture]).toBeDefined();
    },
  );
});
