// File : /TeamSamsara.Workflow/app/src/core/data/batchWrite.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Writes many documents together. Firestore takes at most 500 writes
// in one batch, so longer lists are split into several batches, sent in order.

import {
  writeBatch,
  type Firestore,
  type WriteBatch,
} from "firebase/firestore";

/** Firestore's limit on writes in a single batch. */
export const maxWritesPerBatch = 500;

/** One write to add to a batch, e.g. `(batch) => batch.set(ref, data)`. */
export type BatchWrite = (batch: WriteBatch) => void;

/** Splits a list into pieces of at most `size` items, keeping the order. */
export function splitIntoChunks<TItem>(
  items: readonly TItem[],
  size: number,
): TItem[][] {
  const chunks: TItem[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

/**
 * Commits the writes in batches of at most 500. Each batch is all or nothing;
 * when there are more than 500 writes, earlier batches stay saved if a later
 * one fails.
 */
export async function commitWrites(
  db: Firestore,
  writes: readonly BatchWrite[],
): Promise<void> {
  for (const chunk of splitIntoChunks(writes, maxWritesPerBatch)) {
    const batch = writeBatch(db);
    chunk.forEach((write) => write(batch));
    await batch.commit();
  }
}
