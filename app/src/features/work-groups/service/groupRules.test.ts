// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/groupRules.test.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests which links a work group accepts.

import { describe, expect, it } from "vitest";
import { GroupRulesText } from "../ui/workGroupsContent";
import { checkLink } from "./groupRules";

describe("checkLink", () => {
  it("accepts a named web address", () => {
    expect(
      checkLink({
        label: "Shared drive",
        url: " https://drive.google.com/drive/folders/abc ",
      }),
    ).toBeUndefined();
  });

  it("asks for an address, a real one, and a name", () => {
    expect(checkLink({ label: "Drive", url: "" })).toBe(
      GroupRulesText.urlRequired,
    );
    expect(checkLink({ label: "Drive", url: "drive.google.com" })).toBe(
      GroupRulesText.urlInvalid,
    );
    expect(checkLink({ label: "Drive", url: "javascript:alert(1)" })).toBe(
      GroupRulesText.urlInvalid,
    );
    expect(checkLink({ label: " ", url: "https://x.com" })).toBe(
      GroupRulesText.labelRequired,
    );
  });
});
