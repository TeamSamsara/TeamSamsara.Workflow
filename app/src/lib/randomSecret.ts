// File : /TeamSamsara.Workflow/app/src/lib/randomSecret.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A long random password from the browser's secure random numbers.
// An invited account is created with one; nobody ever sees it, because the
// person chooses their own from the invite email.

const secretBytes = 32;

export function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(secretBytes));
  // Base64 of random bytes, so it has letters, digits and symbols.
  return btoa(String.fromCharCode(...bytes));
}
