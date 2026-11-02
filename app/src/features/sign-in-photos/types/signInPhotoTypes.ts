// File : /TeamSamsara.Workflow/app/src/features/sign-in-photos/types/signInPhotoTypes.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The sign-in page's pictures (config/signin), in the order they
// show. Anyone can read them, before signing in.

import { createConverter, fromDate, readDate } from "@/core/data";

export interface SignInPhoto {
  id: string;
  url: string;
}

export interface SignInPhotos {
  photos: SignInPhoto[];
  updatedAt: Date | null;
}

/** How many there can be (firestore.rules checks the same). */
export const SignInPhotoLimits = { count: 8 } as const;

export const signInPhotosConverter = createConverter<SignInPhotos>({
  parse: (_id, data) => ({
    photos: (Array.isArray(data.slides) ? data.slides : [])
      .filter(
        (entry: unknown): entry is SignInPhoto =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as SignInPhoto).id === "string" &&
          typeof (entry as SignInPhoto).url === "string",
      )
      .map((entry: SignInPhoto) => ({ id: entry.id, url: entry.url })),
    updatedAt: readDate(data, "updatedAt"),
  }),
  serialize: (value) => ({
    slides: value.photos,
    updatedAt: fromDate(value.updatedAt),
  }),
});
