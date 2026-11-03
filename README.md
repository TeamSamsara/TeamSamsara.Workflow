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

From the root, on `main`, with `app/.env.production` filled in (the same values as `.env.development`, with `VITE_USE_FIREBASE_EMULATORS=false`):

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

## Branches

- `main`: what is live
- `dev`: where PRs are merged
- `core/<name>` for foundation work, `feature/<name>` for features, `task/<name>` for small changes
