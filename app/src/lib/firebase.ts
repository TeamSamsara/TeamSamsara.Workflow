// File : /TeamSamsara.Workflow/app/src/lib/firebase.ts
// Version : 1.4.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Initializes Firebase once and exports the Auth, Firestore,
// Functions and Storage clients, pointed at the local emulators when the env
// flag is on. Firestore keeps a copy of what it has read in the browser, so
// pages open fast and keep working through a dropped connection; several open
// tabs share that copy.

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { FirebaseEmulators, FirebaseEnvFlags } from "./firebaseConstants";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Projects made since late 2024 keep files at <project id>.firebasestorage.app.
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/** The server functions (notifications' test email, signing out everywhere). */
export const functions = getFunctions(firebaseApp);

/** Files: profile photos and the sign-in page's pictures. */
export const storage = getStorage(firebaseApp);

export const usesEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === FirebaseEnvFlags.enabled;

/** The Auth emulator's address, for any extra Auth connection (see secondaryAuth). */
export const authEmulatorUrl = `http://${FirebaseEmulators.host}:${FirebaseEmulators.authPort}`;

if (usesEmulators) {
  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  connectFirestoreEmulator(
    db,
    FirebaseEmulators.host,
    FirebaseEmulators.firestorePort,
  );
  connectFunctionsEmulator(
    functions,
    FirebaseEmulators.host,
    FirebaseEmulators.functionsPort,
  );
  connectStorageEmulator(
    storage,
    FirebaseEmulators.host,
    FirebaseEmulators.storagePort,
  );
}
