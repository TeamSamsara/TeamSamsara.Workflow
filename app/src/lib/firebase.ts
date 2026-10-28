// File : /TeamSamsara.Workflow/app/src/lib/firebase.ts
// Version : 1.0.0
// Latest commit: core/project-setup
// Author : Gerrah
// Purpose : Initializes Firebase once and exports the Auth and Firestore
// clients, pointed at the local emulators when the env flag is on.

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { FirebaseEmulators, FirebaseEnvFlags } from "./firebaseConstants";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === FirebaseEnvFlags.enabled) {
  connectAuthEmulator(
    auth,
    `http://${FirebaseEmulators.host}:${FirebaseEmulators.authPort}`,
    { disableWarnings: true },
  );
  connectFirestoreEmulator(
    db,
    FirebaseEmulators.host,
    FirebaseEmulators.firestorePort,
  );
}
