// File : /TeamSamsara.Workflow/app/src/lib/secondaryAuth.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A second Firebase connection used only to create sign-in accounts
// for invites. Creating an account signs into it, so doing it on the main
// connection would sign the admin out; here it happens on the side, kept in
// memory only, and is signed out straight after.

import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut,
} from "firebase/auth";
import { authEmulatorUrl, firebaseConfig, usesEmulators } from "./firebase";

const secondaryAppName = "account-creator";

/** Creates the account and gives back its id. Throws Firebase's error (e.g. the email is taken). */
export async function createAccountOnTheSide(
  email: string,
  password: string,
): Promise<string> {
  // A fresh app each time, so nothing lingers between invites.
  const app = initializeApp(
    firebaseConfig,
    `${secondaryAppName}-${crypto.randomUUID()}`,
  );
  try {
    const secondaryAuth = initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
    if (usesEmulators) {
      connectAuthEmulator(secondaryAuth, authEmulatorUrl, {
        disableWarnings: true,
      });
    }
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password,
    );
    await signOut(secondaryAuth);
    return credential.user.uid;
  } finally {
    await deleteApp(app);
  }
}
