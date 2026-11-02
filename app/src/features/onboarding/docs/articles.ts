// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/articles.ts
// Version : 1.1.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The Documentation: one short article per feature, in groups. Each
// group (or article) is for the people with its permission, the same as the
// walkthrough's chapters, and "Show me in the app" plays that chapter.

import type { PermissionKey } from "@/core/access";
import type { ChapterId } from "../model/chapters";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "steps"; items: readonly string[] }
  | { kind: "list"; items: readonly string[] };

export interface Article {
  id: string;
  title: string;
  /** One line, for search and the list. */
  summary: string;
  body: readonly Block[];
}

export interface DocGroup {
  id: string;
  title: string;
  /** Shown to people with one of these; null is everyone. */
  requires: readonly PermissionKey[] | null;
  /** Its label in the list, e.g. "Plan events". */
  requiresLabel?: string;
  /** The walkthrough chapter that shows it in the app. */
  chapter?: ChapterId;
  articles: readonly Article[];
}

const p = (text: string): Block => ({ kind: "p", text });
const h = (text: string): Block => ({ kind: "h", text });
const steps = (...items: string[]): Block => ({ kind: "steps", items });
const list = (...items: string[]): Block => ({ kind: "list", items });

export const DocGroups: readonly DocGroup[] = [
  {
    id: "around",
    title: "Getting around",
    requires: null,
    chapter: "gettingAround",
    articles: [
      {
        id: "calendar",
        title: "The calendar",
        summary: "What shows on your calendar, and month, week or list.",
        body: [
          p(
            "The calendar opens on My calendar: the events you're in, yourself or through your work groups, events for everyone, the events you made, your open tasks and your personal appointments.",
          ),
          h("Seeing a work group's calendar"),
          p(
            "Pick one of your work groups in the Calendar box. People who can see everything also get Everything.",
          ),
          h("Month, week or list"),
          list(
            "Month: a month at a glance.",
            "Week: 8 AM to midnight, so evening matches fit. Anything earlier shows as a small marker at the top of the day.",
            "List: everything in the month, day by day.",
          ),
          p(
            "The calendar remembers the view and calendar you last used in this browser.",
          ),
        ],
      },
      {
        id: "events",
        title: "Events and their pages",
        summary: "Open an event to see who's in it, its details and its tasks.",
        body: [
          p(
            "Click an event to open its page: when it is, who's in it, its type, its link, the details its workflows asked for, and its tasks with how far along they are.",
          ),
          p(
            "Events you're in yourself are outlined on the calendar. Only the people and work groups in an event (and whoever made it, and people who see everything) can see it, unless it's for Everyone.",
          ),
          p("Events that are part of a set say so, with a link to the set."),
        ],
      },
      {
        id: "time-zones",
        title: "Times and your time zone",
        summary:
          "Times show in your own zone; things are planned in the workspace's.",
        body: [
          p(
            "Everything is planned in the workspace's time zone (set in Settings › General). You can see times in your own instead: pick your time zone, date format and clock on Your account.",
          ),
          p(
            'When your time zone differs, forms that set times say "Times here are in Toronto time", and an event\'s page shows both times.',
          ),
        ],
      },
    ],
  },
  {
    id: "tasks",
    title: "Tasks",
    requires: ["doAssignedTasks"],
    chapter: "myTasks",
    articles: [
      {
        id: "my-tasks",
        title: "My tasks",
        summary: "Your tasks and your work groups', soonest first.",
        body: [
          p(
            "My tasks lists what's given to you or to one of your work groups, grouped by when it's due: late, today, this week, later and no date.",
          ),
          steps(
            "Open a task to see its notes, checklist, links and posts.",
            "Do it, then tick it, or move it to the right status.",
          ),
        ],
      },
      {
        id: "review",
        title: "Sending for review",
        summary: "Some tasks need a check before they're done.",
        body: [
          p(
            "A task that needs approval can't be ticked straight away. Send it for review instead: it waits for someone who approves tasks, and comes back approved or with the changes they asked for.",
          ),
        ],
      },
      {
        id: "live-links",
        title: "Live links",
        summary: "Tasks that ask where the post went live.",
        body: [
          p(
            "Some tasks (a post, a clip) ask for the link to what you published when you finish them. Paste it in when you tick it off; it's kept on the task for everyone.",
          ),
        ],
      },
    ],
  },
  {
    id: "time",
    title: "Your time",
    requires: null,
    chapter: "yourTime",
    articles: [
      {
        id: "usual-week",
        title: "Your usual week",
        summary: "Paint the hours you're usually not free.",
        body: [
          steps(
            "Open Calendar › Availability.",
            "Click or drag over the hours you're usually not free, like school or work.",
            "Press Save.",
          ),
          p(
            "Your hours are in your own time zone, and repeat every week. Managers planning an event see who can make it from them.",
          ),
        ],
      },
      {
        id: "exceptions",
        title: "Exceptions",
        summary: "Dates that aren't like your usual week.",
        body: [
          p(
            "Away for a tournament, an exam or a trip? On My availability, add an exception: a whole day or between two times, unavailable or available. Exceptions override your usual week on that date.",
          ),
        ],
      },
      {
        id: "personal",
        title: "Personal appointments",
        summary: "A dentist visit or a class, on your own calendar.",
        body: [
          p(
            "Add one from New event › Personal appointment (or the Personal appointment button). It shows on your calendar with a lock.",
          ),
          p(
            "Only you and people who can see everyone's availability see what it is. Everyone else sees Busy.",
          ),
        ],
      },
    ],
  },
  {
    id: "planning",
    title: "Planning events",
    requires: ["planEvents"],
    requiresLabel: "Plan events",
    chapter: "planning",
    articles: [
      {
        id: "new-event",
        title: "Planning an event",
        summary: "Title, time, who's in it and its workflows.",
        body: [
          steps(
            "New event › Event.",
            "Give it a title, a type, a date, and a start and end.",
            "Add who's in it: people, work groups or Everyone.",
            "Tick the workflows whose tasks it needs.",
            "Create: the event and its tasks are made together.",
          ),
          p(
            "Words in {curly brackets} in the title (vs. {opponent}) are asked for below, and filled in.",
          ),
        ],
      },
      {
        id: "who-can-make-it",
        title: "Who can make it",
        summary: "Everyone's availability, while you plan.",
        body: [
          p(
            "Once people are in an event, Workflow checks their usual week, exceptions and personal appointments and says how many can make it, and why someone can't.",
          ),
          p(
            "Nearby times when everyone's free are listed below: click one to move the event there.",
          ),
        ],
      },
      {
        id: "repeats",
        title: "Repeating events",
        summary: "Weekly scrims or a Monday meeting.",
        body: [
          p(
            "Press Repeat… on New event, pick the days, and when it ends (never, on a date, or after a number of events). The coming weeks are made for you.",
          ),
          p(
            "From an event's ⋯ menu you can change just that one, change the ones coming up, skip a date, or end the repeat.",
          ),
        ],
      },
    ],
  },
  {
    id: "several",
    title: "Several events and sets",
    requires: ["planEvents"],
    requiresLabel: "Plan events",
    chapter: "several",
    articles: [
      {
        id: "plan-several",
        title: "Planning several events at once",
        summary: "A split or a month of content, one row per event.",
        body: [
          steps(
            "New event › Several events.",
            "Set what they share: the set's name, type, usual times, who's in them, and a title with fields like vs. {opponent}.",
            "Fill the rows: Add dates on a pattern, Paste from a spreadsheet, or Add a row.",
            "Create: each row becomes an event with its own tasks.",
          ),
          p(
            "A field can stay TBD: the event keeps {opponent} in its title until you fill it in on the event.",
          ),
        ],
      },
      {
        id: "sets",
        title: "Sets",
        summary: "Events planned together, managed together.",
        body: [
          p(
            "Calendar › Sets lists them. A set's page shows how many events are played, tasks done, what's next and what's still TBD.",
          ),
          p(
            "Tick events to move several at once (their tasks move too) or delete them. Add events adds more the same way.",
          ),
        ],
      },
    ],
  },
  {
    id: "team",
    title: "Team availability",
    requires: ["viewAvailability"],
    requiresLabel: "See everyone's availability",
    chapter: "teamAvailability",
    articles: [
      {
        id: "team-week",
        title: "A group's week",
        summary: "Who's free when, for a work group.",
        body: [
          p(
            "Calendar › Availability › Team availability shows everyone in a work group: their usual hours, their personal appointments (by name) and the group's events. Anyone booked when they're not free is outlined in red.",
          ),
          p(
            "When everyone's free lists times to plan at: pick one and New event opens there, with the group already in it.",
          ),
        ],
      },
    ],
  },
  {
    id: "workflows",
    title: "Workflows",
    requires: ["editWorkflows"],
    requiresLabel: "Edit workflows",
    chapter: "workflows",
    articles: [
      {
        id: "workflow",
        title: "What a workflow is",
        summary: "A reusable list of tasks for a kind of event.",
        body: [
          p(
            "A workflow lists what happens before, during and after a kind of event (a match, a shoot), who does each task and when it's due, counted from the event's start.",
          ),
          p(
            "Picked when planning an event, its tasks are made for that event with the right dates.",
          ),
        ],
      },
      {
        id: "fields",
        title: "Fields like {opponent}",
        summary: "Details filled in from each event.",
        body: [
          p(
            "A field is a detail an event can have: an opponent, a league, a co-streamer. Set them up in Settings › Fields, each with a type: text, a link, a number, a choice from a list, a date and time, or someone on the team.",
          ),
          p(
            "Write {opponent} in a task's title, notes, checklist or post, or in an event's title, and planning the event asks for it with the right kind of input. {title}, {date}, {time}, {end_time}, {link} and {event_type} fill themselves.",
          ),
          p(
            "Left empty, a field shows as its name in brackets, like [Match link]. Change a value later and the event's unfinished tasks follow, except text someone edited by hand.",
          ),
        ],
      },
    ],
  },
  {
    id: "approving",
    title: "Approving",
    requires: ["approveTasks"],
    requiresLabel: "Approve tasks",
    chapter: "approving",
    articles: [
      {
        id: "approvals",
        title: "Reviews",
        summary: "Approve tasks or ask for changes.",
        body: [
          p(
            "Tasks sent for review wait on My tasks, beside your own. Open one, look at the work, then approve it or ask for changes with a note.",
          ),
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    requires: [
      "administrator",
      "manageSettings",
      "manageMembers",
      "manageRoles",
      "manageWorkGroups",
    ],
    requiresLabel: "Admins",
    chapter: "settings",
    articles: [
      {
        id: "invites",
        title: "Members and invites",
        summary: "Invite people with their roles and groups.",
        body: [
          p(
            "Settings › Members › Invite people. Add their emails, and pick their roles and work groups: the dialog shows the walkthrough they'll get. They get an email to choose a password.",
          ),
          p(
            "From a member's page you can change their name, roles and groups, turn their access off, or remove them.",
          ),
        ],
      },
      {
        id: "roles",
        title: "Roles and permissions",
        summary: "What people can do.",
        body: [
          p(
            "Roles give permissions. Everyone has the Everyone role. You can only give permissions you hold yourself, and only manage roles below your own.",
          ),
        ],
      },
      {
        id: "groups",
        title: "Work groups",
        summary: "Teams, like Bloom or Design.",
        body: [
          p(
            "Work groups act as teams: tasks can be given to a group, events can be for a group, and each person sees their groups' calendars.",
          ),
        ],
      },
      {
        id: "workspace",
        title: "The workspace",
        summary: "Its name, time zone, formats and event types.",
        body: [
          p(
            "Settings › General sets the workspace's time zone (what everything is planned in), date and time formats and default theme. Tasks and events sets the statuses, tags and event types.",
          ),
        ],
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    requires: null,
    chapter: "yours",
    articles: [
      {
        id: "account",
        title: "Your account",
        summary: "Your names, time zone, password.",
        body: [
          p(
            "Click your name at the bottom of the menu. There you set your name and in-game name (shown first wherever you appear), your time zone, date format and clock, your theme, and your password.",
          ),
          p(
            'Forgot your password? "Email me a reset link" on Your account, or "Forgot password?" on the sign-in page.',
          ),
        ],
      },
    ],
  },
];

const allows = (
  requires: readonly PermissionKey[] | null,
  permissions: ReadonlySet<PermissionKey>,
) => !requires || requires.some((key) => permissions.has(key));

/** The groups someone with these permissions sees. */
export function docsFor(permissions: ReadonlySet<PermissionKey>): DocGroup[] {
  return DocGroups.filter((group) => allows(group.requires, permissions));
}

/** Groups and articles whose words match the search. */
export function searchDocs(
  groups: readonly DocGroup[],
  search: string,
): DocGroup[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...groups];
  const text = (article: Article) =>
    [
      article.title,
      article.summary,
      ...article.body.flatMap((block) =>
        "text" in block ? [block.text] : block.items,
      ),
    ]
      .join(" ")
      .toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      articles: group.articles.filter((article) =>
        words.every((word) => text(article).includes(word)),
      ),
    }))
    .filter((group) => group.articles.length > 0);
}
