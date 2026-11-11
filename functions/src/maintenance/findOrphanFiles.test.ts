// File : /TeamSamsara.Workflow/functions/src/maintenance/findOrphanFiles.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests finding photos and sign-in pictures nothing uses any more.

import { describe, expect, it } from "vitest";
import { findOrphanFiles, pathOfUrl } from "./findOrphanFiles.js";

const now = new Date("2026-11-15T09:00:00Z");
const old = new Date("2026-11-01T09:00:00Z");
const url = (path: string) =>
  `https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=x`;

describe("pathOfUrl", () => {
  it("reads the path from a download address", () => {
    expect(pathOfUrl(url("members/okami/photo 1.webp"))).toBe("members/okami/photo 1.webp");
    expect(pathOfUrl("https://example.com/x.png")).toBe(null);
  });
});

describe("findOrphanFiles", () => {
  it("finds week-old files nothing points at, under members/ and signin/ only", () => {
    const files = [
      { name: "members/okami/new.webp", updated: old },
      { name: "members/okami/older.webp", updated: old },
      { name: "members/okami/fresh.webp", updated: now },
      { name: "signin/slide1.jpg", updated: old },
      { name: "signin/slide2.jpg", updated: old },
      { name: "other/thing.png", updated: old },
    ];
    const orphans = findOrphanFiles(
      files,
      [url("members/okami/new.webp"), url("signin/slide1.jpg")],
      now,
    );
    expect(orphans.map((file) => file.name)).toEqual([
      "members/okami/older.webp",
      "signin/slide2.jpg",
    ]);
  });
});
