// File : /TeamSamsara.Workflow/app/src/features/sign-in-photos/hooks/useSignInPhotos.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The sign-in page's pictures, kept up to date. Works signed out.

import { Collections, ConfigDocuments, useLiveDocument } from "@/core/data";
import {
  signInPhotosConverter,
  type SignInPhoto,
} from "../types/signInPhotoTypes";

export interface SignInPhotoList {
  status: "loading" | "ready" | "error";
  photos: SignInPhoto[];
}

export function useSignInPhotos(): SignInPhotoList {
  const result = useLiveDocument(
    `${Collections.config}/${ConfigDocuments.signin}`,
    signInPhotosConverter,
  );
  if (result.status === "ready")
    return { status: "ready", photos: result.data?.photos ?? [] };
  return {
    status: result.status === "error" ? "error" : "loading",
    photos: [],
  };
}
