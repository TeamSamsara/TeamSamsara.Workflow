// File : /TeamSamsara.Workflow/app/src/features/sign-in-photos/service/signInPhotoService.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Adding, ordering and removing the sign-in page's pictures. A new
// one is shrunk in the browser (at most 1600 pixels wide), uploaded to
// Storage and added to the list; a removed one leaves the list first, then
// Storage. Administrators only (the rules check the same).

import { doc, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Collections, ConfigDocuments, serverTime } from "@/core/data";
import { db, storage } from "@/lib/firebase";
import {
  extensionOf,
  loadImage,
  shrinkImage,
} from "@/shared/images/resizeImage";
import type { SignInPhoto } from "../types/signInPhotoTypes";

/** How wide the pictures are saved, in pixels. */
export const signInPhotoWidth = 1600;

function saveList(photos: readonly SignInPhoto[]): Promise<void> {
  return setDoc(doc(db, Collections.config, ConfigDocuments.signin), {
    slides: photos.map(({ id, url }) => ({ id, url })),
    updatedAt: serverTime(),
  });
}

export async function addSignInPhoto(
  file: File,
  current: readonly SignInPhoto[],
): Promise<void> {
  const picture = await shrinkImage(await loadImage(file), signInPhotoWidth);
  const id = `${Date.now()}`;
  const stored = ref(storage, `signin/${id}.${extensionOf(picture)}`);
  await uploadBytes(stored, picture, {
    contentType: picture.type,
    cacheControl: "public, max-age=31536000",
  });
  const url = await getDownloadURL(stored);
  await saveList([...current, { id, url }]);
}

/** Moves one a place earlier (−1) or later (+1). */
export function moveSignInPhoto(
  current: readonly SignInPhoto[],
  id: string,
  by: -1 | 1,
): Promise<void> {
  const from = current.findIndex((photo) => photo.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= current.length) return Promise.resolve();
  const next = [...current];
  [next[from], next[to]] = [next[to], next[from]];
  return saveList(next);
}

export async function removeSignInPhoto(
  current: readonly SignInPhoto[],
  photo: SignInPhoto,
): Promise<void> {
  await saveList(current.filter((entry) => entry.id !== photo.id));
  await deleteObject(ref(storage, photo.url)).catch(() => undefined);
}
