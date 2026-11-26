# Playbook

Team Samsara's internal planning and task tool. Planners build reusable workflows, put events on the calendar and the tasks appear for the right people and work groups, with approvals where they are needed.

React talks straight to Firebase (Auth, Firestore and Storage), and security rules enforce who can do what. A few server functions send notifications, reminders and email. Access is invite only.

## Requirements

- Node `22.22.3` (see `.nvmrc`; `nvm use` picks it up)
- A Firebase web app config for the project, kept in `app/.env.development` (never committed)

## Getting started

```bash
npm install            # root: git hooks (husky, lint-staged)
cd app
npm install            # the app
cp .env.example .env.development   # then fill in the Firebase values
npm run dev
```

## Scripts (in `app/`)

| Script            | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Starts the app with hot reload         |
| `npm run build`   | Type-checks and builds into `app/dist` |
| `npm run lint`    | Runs ESLint                            |
| `npm run preview` | Serves the built app locally           |

A commit runs ESLint and Prettier on the staged files.

## Deploying

From the root, on `main` after a release is merged, with `app/.env.production` filled in (the same values as `.env.development`, with `VITE_USE_FIREBASE_EMULATORS=false`):

```bash
npm run deploy         # builds the app and functions, then deploys hosting, rules, indexes, storage and functions
```

The first deploy asks for `MAIL_FROM` and `APP_URL` (saved in `functions/.env.<project>`, not committed), and lets Storage's rules read Firestore. Every email, invites and password links included, goes out through Resend in Playbook's own design (`functions/src/emails`).

## Project structure

```
app/src/
  app/        startup, providers, router, layouts
  views/      one folder per screen
  features/   one folder per business area (members, roles, workflows, tasks...)
  core/       app-wide systems with no screens (theme, data, session, access, workspace)
  shared/     UI kit, styling tokens and generic helpers
  lib/        wrappers around outside libraries (Firebase, React Query)
```

Each layer imports only from the layers below it: `app → views → features → core → shared → lib`.

## Branches and releases

- `main`: releases, and only releases. What's on `main` is what's live.
- `dev`: the pre-release. Every feature lands here first, and the next release builds up here.
- `feature/<name>` (or `core/<name>`, `task/<name>`, `chore/<name>`): one piece of work, branched from `dev` and merged back into `dev` by a pull request once CI passes and it's been tried locally.

A release:

1. Test the pre-release: `dev` locally, against a copy of the live data in the emulators (`npm run emulators -- --import ./emulator-data`), including Settings › General › Platform updates › Check.
2. Write the release notes in `releases/` (see its README) and merge them into `dev`. Then open a pull request from `dev` to `main` named `Release vX.Y.Z` and merge it.
3. Deploy from `main` (see Deploying), then tag it: `git tag vX.Y.Z && git push origin vX.Y.Z`. Within about 10 minutes, the server runs any platform updates and announces the release to everyone once, and each person sees What's new the next time they open Playbook.

Nothing is deployed from `dev` or a feature branch.
