# Playbook engine

The rules the app and the server functions both run, so a task made in the
browser and a task updated in the background come out exactly the same:
dates and times in a time zone, `{fields}` in text, due times counted from an
event's start, and a workflow's steps turned into tasks for an event.

Plain TypeScript with no dependencies and no Firebase: the app imports it as
`@engine/…` (see `app/vite.config.ts`), and the functions bundle it into
`functions/lib` when they build. Change a rule here and both sides follow.
