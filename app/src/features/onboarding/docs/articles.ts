// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/articles.ts
// Version : 1.7.2
// Latest commit: feature/audit-fixes
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
            "The calendar opens on My calendar: the events you're in, yourself or through your work groups, events for everyone, the events you made and your personal appointments.",
          ),
          h("Showing tasks"),
          p(
            "Tasks are hidden at first, so the calendar shows events. The badge on an event (3/10) is how many of its tasks are done; open the event to see them. Turn on Show tasks to put your tasks and your groups' on the calendar at their due time.",
          ),
          h("Seeing a work group's calendar"),
          p(
            "Pick one of your work groups in the Calendar box. People who can see everything also get Everything.",
          ),
          h("Month, week or list"),
          list(
            "Month: a month at a glance, one line per item so a busy day still fits.",
            "Week: 8 AM to midnight, so evening matches fit. Anything earlier shows as a small marker at the top of the day.",
            "List: everything in the month, day by day.",
          ),
          p(
            "The calendar remembers the view, the calendar and Show tasks you last used in this browser.",
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
        id: "replying",
        title: "Replying: are you going?",
        summary: "Going, Maybe or Can't go, when an event asks.",
        body: [
          p(
            "Some events ask the people in them to reply. Answer Going, Maybe or Can't go on the event's page, or straight from the notification. A note is optional, like \"15 min late\" or why you can't make it. You can change your reply any time.",
          ),
          p(
            "The event's page says whether you're required or optional, and shows everyone's answer. On the calendar a ✓ means you're going, ? maybe, a dot that it's waiting on you, and a struck-through event that you can't go.",
          ),
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
      {
        id: "groups-and-profiles",
        title: "Groups and profiles",
        summary: "Your teams, and who's in them.",
        body: [
          p(
            "Groups in the menu lists every work group, yours first, with your own groups under it. A group's page shows its members (filter them by people tag), its open tasks, what it's about, its key links and what's coming up, with Calendar and Availability tabs for that group.",
          ),
          p(
            "Click anyone's name to open their profile: their tags and groups, what time it is for them, their usual week in their time or yours, what's coming up for them and their tasks you can already see. Nothing there can be changed; people edit their own on Your account.",
          ),
        ],
      },
      {
        id: "notifications",
        title: "Notifications",
        summary: "The bell: what needs you, and reminders.",
        body: [
          p(
            "The bell at the top of the menu counts what's new: a task given to you or your group, a task sent to you to review, yours approved or sent back, events you're added to, moved or cancelled, and events asking you to reply (answer right in the notification). Reminders come before a task is due and before an event starts. Nothing you do yourself notifies you.",
          ),
          p(
            "Work done in bulk sends one notification, not one per task: when a set or repeat is planned you get a summary (how many tasks are yours and your groups', and how many of the events you're in, with Show the tasks), and when someone changes a workflow you get one saying how many of your upcoming tasks moved.",
          ),
          p(
            "Open one to go to its task or event. Choose which kinds you get, by email too, and when you're reminded on Your account › Notifications, where a test email checks that email reaches you.",
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
        summary: "What's yours to do next, coming up, and done this week.",
        body: [
          p(
            "My tasks opens on Mine: what's given to you by name. Switch to My groups to add everything given to your work groups, or Pick groups to choose which. Your choice is remembered.",
          ),
          list(
            "Focus: what's late, due today, and due in the next 7 days, with how many more are coming up.",
            "Planning: everything still to do, including later and no date.",
            "Done this week: what was finished since the week started, by day, with who did and approved it. The card beside it counts each day.",
          ),
          p(
            "Late tasks come first. Inside each part, an event's tasks stay together in the order of its workflow's steps, then by due time; tasks added by hand come after them. Reordering a workflow's steps reorders the tasks it made.",
          ),
          p(
            "Each task shows its event under its title: click it to open the event. A task planned after its due time had already passed says Late from the start, so nobody's blamed for it. One whose event was deleted says Event deleted, with the event's name.",
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
          p(
            "If some of the workflow's tasks would already be due (a Friday match planned on Thursday night), a warning lists them. Create them as late (they're marked Late from the start) or leave them out.",
          ),
        ],
      },
      {
        id: "who-can-make-it",
        title: "Who can make it",
        summary: "Everyone's availability, while you plan.",
        body: [
          p(
            "Once people are in an event, Playbook checks their usual week, exceptions and personal appointments and says how many can make it, and why someone can't.",
          ),
          p(
            "Nearby times when everyone's free are listed below: click one to move the event there.",
          ),
          p(
            "Mark who's Required or Optional with the chip by each name (the same switch as in Asking people to reply). Then only required people count, and the suggested times are when they're free: a coach being away doesn't hide a time that works for the players.",
          ),
        ],
      },
      {
        id: "attendance",
        title: "Asking people to reply",
        summary: "Who's coming, and who's required.",
        body: [
          steps(
            "In the event's form, turn on Ask people to reply.",
            "Everyone in it starts as Required: set the ones who don't have to come to Optional (or use All required and All optional).",
            "Tick Tell me about every reply to hear each answer; otherwise you're told only when someone required can't go.",
          ),
          p(
            "People get a notification to reply. The event's page shows the counts and everyone's answer, grouped by required and optional, with what their availability says. Remind who hasn't replied sends them another notification (once an hour at most).",
          ),
          p(
            "People added later are asked too, as optional until you change it. Each date of a repeating event gets its own replies.",
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
          h("Deleting"),
          p(
            "Delete… asks which to delete: just this one, this and every later one, or the whole series. It counts the events and tasks first. Finished tasks are kept as history unless you untick it: they stay in people's done lists, marked Event deleted.",
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
            "A field can stay TBD: the event keeps {opponent} in its title until you fill it in, on the set's page or on the event.",
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
            "Click a field in the table, like a TBD opponent, to fill it in for that event. The title and the tasks' text fill in too, except text someone changed by hand.",
          ),
          p(
            "Edit set (in the ⋯ menu) changes the set's name, its event titles and fields for every event at once. A field that's different on each event stays as it is unless you type a value.",
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
            "Calendar › Availability › Team availability shows a work group's week. On the left are its people, grouped by people tag (Starter, Coach…). Tick a tag or click a name to show or hide them, and drag names to reorder. Only the people shown are compared, and it's all saved for you only.",
          ),
          list(
            "Hours: each hour of each day, shaded by how many of the people shown are free (bright when all of them are). Click an hour to pick it.",
            "People: one row per person, with when they're free each day.",
          ),
          p(
            "The panel on the right shows the picked hour: who's free, who's busy (a personal appointment shows as Busy, or by name when it was shared with you as their group lead) and who hasn't filled in their availability (they're not counted). Plan an event then opens New event at that time, with the group in it. When everyone shown is free lists stretches of two hours or more.",
          ),
          p(
            "Show times in switches between the team's time zone and yours; the hours and labels move together.",
          ),
        ],
      },
      {
        id: "people-tags",
        title: "People tags",
        summary: "Starter, Sub, Coach: who to compare.",
        body: [
          p(
            "People tags are labels for people, to pick who to compare on Team availability. They don't give anyone permissions. Each team makes its own in Settings › Members › People tags: add, rename, recolour, drag to reorder, or delete.",
          ),
          p(
            "People with the Tag people permission (or Manage members) put tags on members from a member's settings page, or with Edit tags on Team availability. Everyone sees the tags.",
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
      {
        id: "workflow-changes",
        title: "Changing a workflow",
        summary: "Upcoming events can follow your changes.",
        body: [
          p(
            "Save a workflow that upcoming events use and Playbook asks whether to update the tasks it already made for them. It lists what will move, what would already be late (each with Move it anyway), and what's left as it is: finished tasks, and anything someone changed by hand. Only new events uses the new version for events planned from now on.",
          ),
          p(
            "Updating changes due times, titles, notes, checklists and post text. Who a task is given to only changes for new events. People whose tasks moved get one notification about it.",
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
            "Work groups act as teams: tasks can be given to a group, events can be for a group, and each person sees their groups' calendars. Give each a colour for its badge and its dot in the menu.",
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
          p(
            "Administrators also choose the sign-in page's pictures there: add up to 8, put them in order, or remove one. They take turns behind the welcome, and anyone with the link can see them.",
          ),
          h("Database maintenance"),
          p(
            "Every Sunday a check-up looks for data pointing at deleted things (a task whose event is gone, a group that no longer exists) and photos nothing uses, and saves a report. It only reports until an Administrator turns on Apply the fixes; Run now runs it straight away. It never deletes real work: finished tasks stay as history.",
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
        summary: "Your photo, names, time zone, password.",
        body: [
          p(
            "Click your name at the bottom of the menu. There you add a profile photo (drag and zoom to frame it), set your name and in-game name (shown first wherever you appear), your time zone, date format and clock, your theme, and your password.",
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
