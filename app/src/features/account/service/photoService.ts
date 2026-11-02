// File : /TeamSamsara.Workflow/app/src/features/account/service/photoService.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Profile photos. A new one goes to Storage under the member's own
// folder (a new name each time, so nobody sees an old copy), its address is
// saved on their record, then the old file is removed. Removing one clears
// the record first, then the file; an Administrator may remove anyone's.

import { doc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Collections } from "@/core/data";
import { db, storage } from "@/lib/firebase";
import { extensionOf } from "@/shared/images/resizeImage";

/** The size photos are saved at, in pixels (square). */
export const photoSize = 256;

/** Removes a file by its address; one already gone is fine. */
async function removeFile(url: string | null): Promise<void> {
  if (!url) return;
  await deleteObject(ref(storage, url)).catch(() => undefined);
}

export async function savePhoto(
  memberId: string,
  photo: Blob,
  previousUrl: string | null,
): Promise<string> {
  const file = ref(
    storage,
    `members/${memberId}/${Date.now()}.${extensionOf(photo)}`,
  );
  await uploadBytes(file, photo, {
    contentType: photo.type,
    cacheControl: "public, max-age=31536000",
  });
  const url = await getDownloadURL(file);
  await updateDoc(doc(db, Collections.members, memberId), { photoUrl: url });
  await removeFile(previousUrl);
  return url;
}

export async function removePhoto(
  memberId: string,
  url: string | null,
): Promise<void> {
  await updateDoc(doc(db, Collections.members, memberId), { photoUrl: null });
  await removeFile(url);
}
