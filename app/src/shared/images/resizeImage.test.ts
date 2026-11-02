// File : /TeamSamsara.Workflow/app/src/shared/images/resizeImage.test.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Tests the square cut from a picture for a profile photo.

import { describe, expect, it } from "vitest";
import { squareCrop } from "./resizeImage";

describe("squareCrop", () => {
  it("takes the largest centred square", () => {
    expect(squareCrop(400, 200, 1, 0, 0)).toEqual({
      x: 100,
      y: 0,
      width: 200,
      height: 200,
    });
  });

  it("zooms in and moves within the picture", () => {
    expect(squareCrop(400, 400, 2, -1, 1)).toEqual({
      x: 0,
      y: 200,
      width: 200,
      height: 200,
    });
    // Moving past the edge stops at the edge.
    expect(squareCrop(400, 200, 1, 5, 0).x).toBe(200);
  });
});
