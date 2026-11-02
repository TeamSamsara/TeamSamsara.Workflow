// File : /TeamSamsara.Workflow/app/src/lib/firebaseConstants.ts
// Version : 1.2.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Where the local Firebase emulators listen, and the value of the env
// flag that turns them on.

export const FirebaseEmulators = {
  host: "127.0.0.1",
  authPort: 9099,
  firestorePort: 8080,
  functionsPort: 5001,
  storagePort: 9199,
} as const;

export const FirebaseEnvFlags = {
  enabled: "true",
} as const;
