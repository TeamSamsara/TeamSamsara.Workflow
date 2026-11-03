// File : /TeamSamsara.Workflow/app/src/features/members/service/emailList.test.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Tests reading emails out of pasted text: every separator, case,
// repeats, and handing back what isn't an email.

import { describe, expect, it } from "vitest";
import { addEmails, splitEmails } from "./emailList";

describe("splitEmails", () => {
  it("splits on commas, semicolons, spaces and new lines", () => {
    expect(splitEmails(" a@x.co, b@x.co;c@x.co\nd@x.co  e@x.co ")).toEqual([
      "a@x.co",
      "b@x.co",
      "c@x.co",
      "d@x.co",
      "e@x.co",
    ]);
    expect(splitEmails(" , \n")).toEqual([]);
  });
});

describe("addEmails", () => {
  it("adds new emails lower-cased, once each", () => {
    expect(
      addEmails(
        ["mika@example.com"],
        "Lena@Example.com, mika@example.com, lena@example.com",
      ),
    ).toEqual({
      emails: ["mika@example.com", "lena@example.com"],
      rejected: [],
    });
  });

  it("hands back what isn't an email", () => {
    expect(addEmails([], "sam@example.com, nope, @broken")).toEqual({
      emails: ["sam@example.com"],
      rejected: ["nope", "@broken"],
    });
  });
});
