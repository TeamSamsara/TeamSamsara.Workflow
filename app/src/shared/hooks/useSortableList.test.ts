// File : /TeamSamsara.Workflow/app/src/shared/hooks/useSortableList.test.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Tests the order helpers behind useSortableList: moving an id,
// keeping moves below locked rows, and the arrow keys.

import { describe, expect, it } from "vitest";
import { clampIndex, keyboardTarget, moveId } from "./useSortableList";

describe("moveId", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves down and up", () => {
    expect(moveId(ids, "a", 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveId(ids, "d", 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("keeps the list as it is for an unknown id, and stays in range", () => {
    expect(moveId(ids, "x", 1)).toEqual(ids);
    expect(moveId(ids, "b", 99)).toEqual(["a", "c", "d", "b"]);
    expect(moveId(ids, "c", -5)).toEqual(["c", "a", "b", "d"]);
  });

  it("never changes the list it was given", () => {
    moveId(ids, "a", 3);
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });
});

describe("clampIndex", () => {
  it("keeps moves below the locked rows and inside the list", () => {
    expect(clampIndex(0, 5, 2)).toBe(2);
    expect(clampIndex(3, 5, 2)).toBe(3);
    expect(clampIndex(9, 5, 0)).toBe(4);
  });
});

describe("keyboardTarget", () => {
  it("moves one place with the arrow keys and ignores other keys", () => {
    expect(keyboardTarget("ArrowUp", 2)).toBe(1);
    expect(keyboardTarget("ArrowDown", 2)).toBe(3);
    expect(keyboardTarget("Enter", 2)).toBeNull();
  });
});
