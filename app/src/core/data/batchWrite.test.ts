// File : /TeamSamsara.Workflow/app/src/core/data/batchWrite.test.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Tests that long lists of writes are split under Firestore's batch
// limit without losing or reordering any.

import { describe, expect, it } from "vitest";
import { maxWritesPerBatch, splitIntoChunks } from "./batchWrite";

describe("splitIntoChunks", () => {
  it("keeps a short list in one piece", () => {
    expect(splitIntoChunks([1, 2, 3], maxWritesPerBatch)).toEqual([[1, 2, 3]]);
  });

  it("splits at the limit and keeps the order", () => {
    const writes = Array.from({ length: 1001 }, (_, index) => index);
    const chunks = splitIntoChunks(writes, maxWritesPerBatch);
    expect(chunks.map((chunk) => chunk.length)).toEqual([500, 500, 1]);
    expect(chunks.flat()).toEqual(writes);
  });

  it("gives no pieces for no writes", () => {
    expect(splitIntoChunks([], maxWritesPerBatch)).toEqual([]);
  });
});
