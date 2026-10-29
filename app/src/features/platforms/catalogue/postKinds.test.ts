// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/postKinds.test.ts
// Version : 1.0.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Tests what can be published on a platform with and without its
// paid tier: X goes from 280 to 25,000 characters and gains Articles; a
// platform without a tier is the same either way.

import { describe, expect, it } from "vitest";
import { describeLimits } from "../ui/describeLimits";
import { findPlatform, postKinds } from "./platformCatalogue";

const x = findPlatform("x")!;
const twitch = findPlatform("twitch")!;

describe("postKinds", () => {
  it("gives X the regular limits without Premium", () => {
    const kinds = postKinds(x, false);
    expect(kinds.map((kind) => kind.id)).toEqual(["post"]);
    expect(kinds[0].texts[0].maxCharacters).toBe(280);
  });

  it("raises X's limit and adds Articles with Premium", () => {
    const kinds = postKinds(x, true);
    expect(kinds.map((kind) => kind.id)).toEqual(["post", "article"]);
    expect(kinds[0].texts[0].maxCharacters).toBe(25000);
    expect(kinds[1].texts[0].maxCharacters).toBe(100000);
  });

  it("ignores Premium for a platform that has no paid tier", () => {
    expect(postKinds(twitch, true)).toEqual(postKinds(twitch, false));
  });
});

describe("describeLimits", () => {
  it("writes every kind of post in one line", () => {
    expect(describeLimits(x)).toBe(
      "Post 280 characters · up to 4 images · 1 video",
    );
    expect(describeLimits(x, true)).toBe(
      "Post 25,000 characters · up to 4 images · 1 video · Articles 100,000 characters",
    );
  });
});
