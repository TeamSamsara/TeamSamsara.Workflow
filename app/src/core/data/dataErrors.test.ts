// File : /TeamSamsara.Workflow/app/src/core/data/dataErrors.test.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Tests sorting Firestore errors into the kinds the screens show.

import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";
import { dataErrorKind, dataErrorMessage } from "./dataErrors";
import { DataErrorText } from "./dataContent";

describe("dataErrorKind", () => {
  it("sorts the codes the app expects", () => {
    expect(dataErrorKind(new FirebaseError("permission-denied", ""))).toBe(
      "notAllowed",
    );
    expect(dataErrorKind(new FirebaseError("unavailable", ""))).toBe("offline");
    expect(dataErrorKind(new FirebaseError("not-found", ""))).toBe("notFound");
    expect(dataErrorKind(new FirebaseError("aborted", ""))).toBe("conflict");
  });

  it("accepts codes with the firestore/ prefix", () => {
    expect(
      dataErrorKind(new FirebaseError("firestore/permission-denied", "")),
    ).toBe("notAllowed");
  });

  it("calls anything else unknown", () => {
    expect(dataErrorKind(new FirebaseError("internal", ""))).toBe("unknown");
    expect(dataErrorKind(new Error("boom"))).toBe("unknown");
    expect(dataErrorKind("boom")).toBe("unknown");
  });

  it("gives the matching message", () => {
    expect(dataErrorMessage(new FirebaseError("unavailable", ""))).toBe(
      DataErrorText.offline,
    );
  });
});
