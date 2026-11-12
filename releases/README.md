# Release notes

What's new in each version of Playbook, as people read it: in the What's new
panel the first time they open Playbook after a release, on Help › What's new,
and in the notification (and email) everyone gets once the release is live.

The notes are content, written together before each release, never made up by
the code. `index.ts` lists every release, newest first; each entry follows
`types.ts`:

- `version` ("1.2.0") and `date` ("2026-11-12", the day it goes live)
- `summary`: one or two sentences, used in the notification and the email
- `changes`: each one `new`, `improved` or `fixed`, with a short `title` and
  a `body` in plain words. Optional:
  - `highlight: true` puts it in the What's new panel (the panel shows the
    highlights one at a time; with none marked, it shows the first few new
    ones)
  - `audience: "admins"` shows it only to Administrators
  - `article`: the id of the help article that explains it (see
    `app/src/features/onboarding/docs/articles.ts`)
  - `picture`: the name of a picture drawn for it in the app
    (`app/src/features/whats-new/ui/ReleasePicture.tsx`)

The app and the server functions both read this folder, so adding a release
here and deploying it is all it takes: the server announces it once (see
`functions/src/releases.ts`) and the app shows it to each person once.
