// File : /TeamSamsara.Workflow/releases/model.test.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Tests reading release notes: versions in order, the one a person
// hasn't seen, Administrators' changes, and the panel's highlights. The
// releases here are made up for the tests only.
// describe, it and expect come from Vitest's globals (see app/vitest.config.ts).

import {
  compareVersions,
  highlightsOf,
  latestRelease,
  releaseForViewer,
  unseenRelease,
} from "./model.js";
import type { Release } from "./types.js";

const change = (
  kind: "new" | "improved" | "fixed",
  title: string,
  extra = {},
) => ({ kind, title, body: "", ...extra });

const older: Release = {
  version: "1.9.2",
  date: "2026-01-10",
  summary: "Older",
  changes: [change("fixed", "A")],
};
const newer: Release = {
  version: "1.10.0",
  date: "2026-02-01",
  summary: "Newer",
  changes: [
    change("improved", "B"),
    change("new", "C"),
    change("new", "D", { audience: "admins" }),
    change("fixed", "E", { highlight: true }),
  ],
};

describe("release notes", () => {
  it("orders versions by number, not as text", () => {
    expect(compareVersions("1.10.0", "1.9.2")).toBeGreaterThan(0);
    expect(latestRelease([older, newer])?.version).toBe("1.10.0");
    expect(latestRelease([])).toBeNull();
  });

  it("shows the latest once, and not to people who joined after it", () => {
    expect(unseenRelease([older, newer], "1.9.2", "2025-12-01")).toBe(newer);
    expect(unseenRelease([older, newer], "1.10.0", "2025-12-01")).toBeNull();
    expect(unseenRelease([older, newer], null, "2025-12-01")).toBe(newer);
    expect(unseenRelease([older, newer], null, "2026-03-01")).toBeNull();
  });

  it("keeps Administrators' changes for them", () => {
    expect(releaseForViewer(newer, false).changes.map((c) => c.title)).toEqual([
      "B",
      "C",
      "E",
    ]);
    expect(releaseForViewer(newer, true).changes).toHaveLength(4);
  });

  it("puts the highlights in the panel, else the new things", () => {
    expect(highlightsOf(newer).map((c) => c.title)).toEqual(["E"]);
    expect(highlightsOf(older).map((c) => c.title)).toEqual(["A"]);
    const noHighlight = { ...newer, changes: newer.changes.slice(0, 3) };
    expect(highlightsOf(noHighlight).map((c) => c.title)).toEqual(["C", "D"]);
  });
});
