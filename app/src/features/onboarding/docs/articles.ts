// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/articles.ts
// Version : 1.8.5
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The Documentation: one short article per feature, in groups. Each
// group (or article) is for the people with its permission, the same as the
// walkthrough's chapters, and "Show me in the app" plays that chapter.

import type { PermissionKey } from "@/core/access";
import type { ChapterId } from "../model/chapters";
import type { PictureName } from "./pictures";

/** One thing a picture's numbered mark points at. */
export interface Callout {
  title: string;
  text: string;
}

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "steps"; items: readonly string[] }
  | { kind: "list"; items: readonly string[] }
  /** A picture, with what its numbered marks point at beside it. */
  | {
      kind: "figure";
      picture: PictureName;
      caption: string;
      callouts: readonly Callout[];
    }
  /** Steps side by side, each with its own small picture. */
  | {
      kind: "frames";
      items: readonly { picture: PictureName; text: string }[];
    }
  /** The same thing before and after. */
  | {
      kind: "compare";
      before: PictureName;
      after: PictureName;
      note: string;
      /** Instead of Before and After. */
      labels?: readonly [string, string];
    }
  | { kind: "tip"; text: string };

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
const figure = (
  picture: PictureName,
  caption: string,
  ...callouts: Callout[]
): Block => ({ kind: "figure", picture, caption, callouts });
const callout = (title: string, text: string): Callout => ({ title, text });
const frames = (...items: [PictureName, string][]): Block => ({
  kind: "frames",
  items: items.map(([picture, text]) => ({ picture, text })),
});
const compare = (
  before: PictureName,
  after: PictureName,
  note: string,
  labels?: readonly [string, string],
): Block => ({ kind: "compare", before, after, note, labels });
const tip = (text: string): Block => ({ kind: "tip", text });

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
          figure(
            "calendarControls",
            "The calendar, on a week.",
            callout(
              "Which calendar",
              "My calendar, or one of your work groups'. People who can see everything also get Everything.",
            ),
            callout(
              "Show tasks",
              "Off at first, so the calendar shows events. Turn it on to put your tasks and your groups' on it at their due time.",
            ),
            callout(
              "Month, week or list",
              "Month: one line per item, so a busy day still fits. Week: 8 AM to midnight, with anything earlier as a small marker at the top. List: everything in the month, day by day.",
            ),
            callout(
              "An event",
              "Outlined when you're in it yourself. 3/10 is how many of its tasks are done; open it to see them.",
            ),
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
          p("Click an event to open its page."),
          figure(
            "eventPage",
            "A match's page.",
            callout(
              "Who's in it",
              "People and work groups. Only they (and whoever made it, and people who see everything) can see it, unless it's for Everyone.",
            ),
            callout(
              "Its details",
              "What its workflows asked for, like the opponent. They fill in its title and its tasks' text.",
            ),
            callout(
              "Its tasks",
              "Every task it has, who has it and how far along it is.",
            ),
          ),
          p(
            "Events that are part of a set say so at the top, with a link to the set. Its ⋯ menu edits or deletes it (or, for a repeat, this one or the ones after it), and Update tasks from workflows brings its open tasks in line with its workflows.",
          ),
        ],
      },
      {
        id: "replying",
        title: "Replying: are you going?",
        summary: "Going, Maybe or Can't go, when an event asks.",
        body: [
          p(
            "Some events ask the people in them to reply. Answer on the event's page, or straight from the notification.",
          ),
          figure(
            "replyBox",
            "Replying on an event's page.",
            callout(
              "Your answer",
              "Going, Maybe or Can't go. Change it any time. The page says whether you're required or optional.",
            ),
            callout(
              "A note",
              'Optional, like "15 min late" or why you can\'t make it.',
            ),
            callout(
              "Everyone's answers",
              "How many are going, and who's still to answer.",
            ),
          ),
          h("On the calendar"),
          figure("replyMarks", "How your answer shows on an event."),
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
          compare(
            "timesOnForm",
            "timesOnEvent",
            "Someone in London planning a Toronto match: the form says which time it uses, and the event shows both.",
            ["Planning it", "On its page"],
          ),
        ],
      },
      {
        id: "groups-and-profiles",
        title: "Groups and profiles",
        summary: "Your teams, and who's in them.",
        body: [
          p(
            "Groups in the menu lists every work group, yours first, with your own groups under it.",
          ),
          figure(
            "groupPage",
            "A work group's page.",
            callout(
              "Its tabs",
              "Overview, then the group's own Calendar and Availability.",
            ),
            callout(
              "Its members",
              "Leads are marked. Filter them by people tag, and click a name to open their profile.",
            ),
            callout(
              "Its open tasks",
              "What the group still has to do, beside what it's about, its key links and what's coming up.",
            ),
          ),
          h("Someone's profile"),
          figure(
            "profile",
            "A member's profile.",
            callout("Their time", "What time it is for them right now."),
            callout(
              "Their usual week",
              "When they're usually free, in their time or yours.",
            ),
            callout(
              "Their tags",
              "People who can tag people click a tag to put it on or take it off.",
            ),
          ),
          p(
            "A profile also shows their groups, what's coming up for them and their tasks you can already see. Their name and photo are theirs to change, on Your account.",
          ),
        ],
      },
      {
        id: "notifications",
        title: "Notifications",
        summary: "The bell: what needs you, and reminders.",
        body: [
          p("The bell at the top of the menu counts what's new:"),
          list(
            "A task given to you or your group, or sent to you to review.",
            "Yours approved, or sent back with changes.",
            "Events you're added to, moved or cancelled, and events asking you to reply.",
            "Reminders before a task is due and before an event starts.",
          ),
          p("Nothing you do yourself notifies you."),
          figure(
            "notificationList",
            "The notifications list.",
            callout(
              "What's new",
              "Unread ones are tinted green. Open one to go to its task or event; All or Unread filters the list.",
            ),
            callout(
              "Answer right there",
              "An event asking you to reply has Going, Maybe and Can't go on it.",
            ),
            callout(
              "One for work done in bulk",
              "A planned set or repeat sends one summary, not one per task. So does a changed workflow, saying how many of your upcoming tasks moved.",
            ),
          ),
          p(
            "Choose which kinds you get, by email too, and when you're reminded on Your account › Notifications, where a test email checks that email reaches you.",
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
            "My tasks is what's yours to do. It opens on Mine: what's given to you by name.",
          ),
          figure(
            "myTasksPage",
            "My tasks, showing Mine in Focus.",
            callout(
              "Whose tasks",
              "Mine, My groups (adds what's given to your work groups) or Pick groups. Your choice is remembered.",
            ),
            callout(
              "How much",
              "Focus: late, today and the next 7 days. Planning: everything still to do. Done this week: what's finished, by day.",
            ),
            callout("Late first", "Anything late is always at the top."),
            callout(
              "Its event",
              "Under each task, the event it's for. Click it to open the event.",
            ),
          ),
          h("The order of your tasks"),
          p(
            "An event's tasks stay together, in the order of its workflow's steps, then by due time. Tasks added by hand come after them. Reordering a workflow's steps reorders the tasks it made.",
          ),
          figure(
            "taskOrder",
            "One event's tasks, in the order of its workflow.",
          ),
          p(
            "A task planned after its due time had already passed says Late from the start, so nobody's blamed for it. One whose event was deleted says Event deleted, with the event's name.",
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
            "A task that needs approval can't be ticked straight away. Send it for review instead.",
          ),
          frames(
            ["reviewSend", "Finish the work, then Send for review."],
            [
              "reviewDecide",
              "Someone who approves tasks checks it: Approve, or Ask for changes.",
            ],
            [
              "reviewBack",
              "Changes come back to you with their note. Fix them and send it again.",
            ],
          ),
          p("You're notified when it's approved or sent back."),
        ],
      },
      {
        id: "live-links",
        title: "Live links",
        summary: "Tasks that ask where the post went live.",
        body: [
          p(
            "Some tasks (a post, a clip) ask for the link to what you published before they can be done.",
          ),
          figure("liveLink", "Finishing a post."),
          p(
            "Paste it in, then Mark as done. It's kept on the task, so everyone can find the post.",
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
          figure(
            "usualWeek",
            "Calendar › Availability: evenings blocked for work.",
          ),
          steps(
            "Open Calendar › Availability.",
            "Click or drag over the hours you're usually not free, like school or work.",
            "Press Save.",
          ),
          p(
            "Your hours are in your own time zone, and repeat every week. People planning an event see who can make it from them.",
          ),
        ],
      },
      {
        id: "exceptions",
        title: "Exceptions",
        summary: "Dates that aren't like your usual week.",
        body: [
          figure("exception", "A weekend away for a tournament."),
          p(
            "Away for a tournament, an exam or a trip? On My availability, add an exception: a whole day or between two times, unavailable or available. Exceptions override your usual week on those dates.",
          ),
        ],
      },
      {
        id: "personal",
        title: "Personal appointments",
        summary: "A dentist visit or a class, on your own calendar.",
        body: [
          compare(
            "personalYours",
            "personalOthers",
            "You see what it is, with a lock. Everyone else sees Busy on those hours, unless you share it with your group leads.",
            ["You see", "Everyone else sees"],
          ),
          p(
            "Add one from New event › Personal appointment. Tick Share with my group leads when they should know what it is, like a class that clashes with practice.",
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
          figure(
            "newEventForm",
            "New event › Event: a match against Final Boss Black.",
            callout(
              "Its title",
              "Words in {curly brackets} (vs. {opponent}) are asked for beside it and filled in, in the title and in the tasks.",
            ),
            callout(
              "Who's in it",
              "People, work groups or Everyone. They see it on their calendar.",
            ),
            callout(
              "Its workflows",
              "Tick the ones whose tasks it needs. Workflows suggested for its type are ticked for you.",
            ),
            callout("Create", "The event and all its tasks are made together."),
          ),
          h("Tasks that would already be late"),
          figure("lateWarning", "Planning a Friday match on Thursday night."),
          p(
            "If some tasks would already be due, a warning lists them. Create them anyway (they're marked Late from the start, so nobody's blamed for it) or leave them out.",
          ),
        ],
      },
      {
        id: "who-can-make-it",
        title: "Who can make it",
        summary: "Everyone's availability, while you plan.",
        body: [
          p(
            "Once people are in an event, Playbook checks their usual week, exceptions and personal appointments while you plan.",
          ),
          figure(
            "whoCanMake",
            "Who can make it, beside the event's form.",
            callout(
              "How many",
              "How many of the people who have to be there can make it.",
            ),
            callout(
              "Why someone can't",
              "Away, busy, or outside their usual week. Personal appointments only ever show as Busy.",
            ),
            callout(
              "Required or Optional",
              "Click the chip by each name. Only required people count, so a coach being away doesn't hide a time that works for the players.",
            ),
            callout(
              "Times that work",
              "Nearby times when everyone required is free. Click one to move the event there.",
            ),
          ),
        ],
      },
      {
        id: "attendance",
        title: "Asking people to reply",
        summary: "Who's coming, and who's required.",
        body: [
          frames(
            ["askReplyOn", "In the event's form, turn on Ask people to reply."],
            ["askReplyNotice", "Everyone in it gets a notification to answer."],
            [
              "askReplyCounts",
              "The event's page counts the answers. Remind nudges who hasn't replied.",
            ],
          ),
          p(
            "Everyone starts as Required: set the ones who don't have to come to Optional, or use All required and All optional. Tick Tell me about every reply to hear each answer; otherwise you're told only when someone required can't go.",
          ),
          p(
            "Remind sends another notification at most once an hour. People added later are asked too, as optional until you change it. Each date of a repeating event gets its own replies.",
          ),
        ],
      },
      {
        id: "repeats",
        title: "Repeating events",
        summary: "Weekly scrims or a Monday meeting.",
        body: [
          figure(
            "repeatPicker",
            "New event › Repeat…: scrims every Tuesday and Thursday.",
          ),
          p(
            "Pick the days and when it ends: never, on a date, or after a number of events. The coming weeks are made for you, each with its own tasks.",
          ),
          p(
            "From an event's ⋯ menu you can change just that one, change the ones coming up, skip a date, or end the repeat.",
          ),
          h("Deleting"),
          figure("deleteRepeat", "Delete… on a repeating event."),
          p(
            "Choose just this one, this and every later one, or the whole series. It counts the events and tasks first. Finished tasks are kept as history unless you untick it: they stay in people's done lists, marked Event deleted.",
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
          frames(
            [
              "severalShared",
              "New event › Several events. Set what they share, with a title like vs. {opponent}.",
            ],
            [
              "severalRows",
              "Fill the rows: dates on a pattern, pasted from a spreadsheet, or one by one.",
            ],
            [
              "severalMade",
              "Create: each row becomes an event with its own tasks, kept together as a set.",
            ],
          ),
          tip(
            "Don't know every opponent yet? Leave it TBD. Fill it in later from the set's page, and the title and tasks follow.",
          ),
        ],
      },
      {
        id: "sets",
        title: "Sets",
        summary: "Events planned together, managed together.",
        body: [
          p(
            "Calendar › Sets lists the events you planned together. A set's page shows how many are played, how many tasks are done, what's next and what's still TBD.",
          ),
          figure(
            "setPage",
            "A set's page, with two opponents still to come.",
            callout(
              "A field to fill in",
              "TBD means that event doesn't have it yet. Click it to fill it in.",
            ),
            callout(
              "The set's ⋯ menu",
              "Edit set fills a field for every event at once, renames the set, or changes how its titles read.",
            ),
            callout(
              "A title waiting for it",
              "A title still showing {opponent} fills in as soon as the opponent is known.",
            ),
          ),
          h("Fill in one event"),
          frames(
            ["fillClick", "Click the TBD in that event's row."],
            ["fillType", "Type it, or pick a person, and save."],
            ["fillDone", "The title and the tasks' text fill in."],
          ),
          compare(
            "taskBeforeFill",
            "taskAfterFill",
            "Text that came from the workflow fills in. Text someone wrote themselves stays as it is, and finished tasks don't change.",
          ),
          tip(
            "Same value for every event? Use Edit set in the ⋯ menu. A field that's different on each event stays as it is unless you type a value.",
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
            "Calendar › Availability › Team availability shows a work group's week, to find a time that works.",
          ),
          figure(
            "teamAvailability",
            "Team availability for the Players.",
            callout(
              "Who to compare",
              "Grouped by people tag. Tick a tag or a name to show or hide them, and drag names to reorder. It's saved for you only.",
            ),
            callout(
              "When they're free",
              "Each hour is shaded by how many of the people shown are free: bright when all of them are. Click one to see who's free and plan an event at that time.",
            ),
            callout(
              "Whose time",
              "Switch between the team's time zone and yours; the hours move together.",
            ),
          ),
          p(
            "People shows one row per person instead. Someone with a personal appointment shows as Busy, or by name when they shared it with you as their group lead. People who haven't filled in their availability aren't counted.",
          ),
        ],
      },
      {
        id: "people-tags",
        title: "People tags",
        summary: "Starter, Sub, Coach: who to compare.",
        body: [
          p(
            "People tags are labels like Starter, Sub or Coach, to pick who to compare on Team availability. They don't give anyone permissions.",
          ),
          compare(
            "tagsSettings",
            "tagsOnPerson",
            "Each team makes its own in Settings › Members › People tags, then puts them on people.",
            ["Make them", "Put them on people"],
          ),
          p(
            "People with the Tag people permission (or Manage members) put tags on someone from their profile, their member settings, or Edit tags on Team availability. Everyone sees the tags.",
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
            "A workflow lists what happens before, during and after a kind of event (a match, a shoot): each task, who does it and when it's due.",
          ),
          figure(
            "workflowTasks",
            "A workflow for match days.",
            callout(
              "A task",
              "Its title, how to do it, and who it's given to: people or a work group. Add a checklist, post text, reference links or a live link.",
            ),
            callout(
              "Needs approval",
              "Someone who approves tasks checks it before it counts as done.",
            ),
            callout(
              "Suggested for",
              "Planning an event of this type ticks this workflow for you.",
            ),
            callout(
              "Its fields",
              "Details like {opponent} that its tasks use, asked for when an event is planned.",
            ),
          ),
          h("When tasks are due"),
          p(
            "Due times are counted from when the event starts, so the same workflow fits any date.",
          ),
          figure("dueTimeline", "A Monday 7 PM match."),
          p(
            "Picked when planning an event, its tasks are made for that event with the right dates. Change the workflow later and upcoming events follow.",
          ),
        ],
      },
      {
        id: "fields",
        title: "Fields like {opponent}",
        summary: "Details filled in from each event.",
        body: [
          p(
            "A field is a detail an event can have: an opponent, a league, a co-streamer. Write {opponent} in a task's title, notes, checklist or post, or in an event's title, and planning the event asks for it.",
          ),
          compare(
            "fieldInWorkflow",
            "fieldFilled",
            "Planned against Nine Lives, the event's tasks say so.",
            ["In the workflow", "In the event's tasks"],
          ),
          h("Kinds of field"),
          p(
            "Set them up in Settings › Fields. Each has a kind, so planning asks with the right input.",
          ),
          figure("fieldTypes", "One field of each kind."),
          tip(
            "{title}, {date}, {time}, {end_time}, {link} and {event_type} fill themselves.",
          ),
          p(
            "Left empty, a field shows as its name in brackets, like [Match link]. Change a value later and the event's unfinished tasks follow, except text someone edited by hand.",
          ),
        ],
      },
      {
        id: "workflow-changes",
        title: "Changing a workflow",
        summary: "Upcoming events follow your changes by themselves.",
        body: [
          p(
            "Save a workflow and every upcoming event that uses it updates its open tasks in a moment: due times, who they're given to, titles, notes, checklists and post text. A step you add becomes a task on each of those events.",
          ),
          frames(
            ["stepChanged", "Change a step and save the workflow."],
            ["eventsFollow", "Every upcoming event's task follows."],
            ["notified", "The people whose tasks moved get one notification."],
          ),
          h("What stays as it is"),
          compare(
            "handEditBefore",
            "handEditAfter",
            "Anything someone changed by hand on a task stays as they left it. Finished tasks and past events don't change, and a due time never moves to one that has already passed.",
          ),
          h("Updating one event yourself"),
          figure(
            "updateFromWorkflows",
            "An event's ⋯ menu › Update tasks from workflows.",
            callout(
              "The event's ⋯ menu",
              "Update tasks from workflows lists its open tasks that differ from their steps, and what differs.",
            ),
            callout(
              "Due times too?",
              "Due times only move if you tick this. Ticks on checklist items always stay.",
            ),
          ),
          p("Steps with no task on the event can be added from the same list."),
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
            "Tasks sent for review wait on My tasks, beside your own. Open one and look at the work.",
          ),
          figure("reviewDecide", "A task waiting for you."),
          p(
            "Approve it and it's done. Or ask for changes, with a note saying what: it goes back to whoever sent it.",
          ),
          figure("askChanges", "Asking for changes."),
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
          figure(
            "inviteDialog",
            "Settings › Members › Invite people.",
            callout("Their emails", "As many as you like at once."),
            callout(
              "Their roles and work groups",
              "What they can do, and which teams they're in from the start.",
            ),
            callout(
              "Their walkthrough",
              "The dialog shows the walkthrough they'll get the first time they sign in, which follows what their roles allow.",
            ),
          ),
          p(
            "They get an email to choose a password. Invite links work for 1 hour; if one runs out, resend it.",
          ),
          h("A member's page"),
          figure("memberAccess", "Someone who hasn't signed in yet."),
          p(
            "Change their name, roles and groups there, resend their invite, turn their access off (and back on), or remove them.",
          ),
        ],
      },
      {
        id: "roles",
        title: "Roles and permissions",
        summary: "What people can do.",
        body: [
          figure(
            "rolesList",
            "Settings › Roles.",
            callout(
              "Highest first",
              "Drag to reorder. You only manage roles below your own. Everyone is at the bottom, and everyone has it.",
            ),
            callout(
              "Its permissions",
              "Tick what the role can do. You can only give permissions you hold yourself.",
            ),
          ),
          p(
            "Someone with several roles can do what any of them allows. Each role has a colour, shown next to names and on role chips.",
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
          figure("workGroupsList", "Settings › Work groups."),
          p(
            "Open one to name it, give it a colour for its badge and its dot in the menu, add or remove members and mark its leads. Tasks given to a work group show up in every member's My tasks.",
          ),
        ],
      },
      {
        id: "workspace",
        title: "The workspace",
        summary: "Its name, time zone, formats and event types.",
        body: [
          figure(
            "generalSettings",
            "Settings › General.",
            callout(
              "Workspace time zone",
              "What everything is planned in. People can still see times in their own.",
            ),
            callout(
              "Formats",
              "When the week starts, and how dates and times are written.",
            ),
            callout(
              "Default theme",
              "For new members. Each person can still pick their own.",
            ),
          ),
          p(
            "Settings › Tasks and events sets the statuses, tags and event types. Administrators also choose the sign-in page's pictures on General: up to 8, in order, taking turns behind the welcome. Anyone with the link can see them.",
          ),
          h("Platform updates"),
          p(
            "Some new versions of Playbook come with a one-time update to the data already stored. They run by themselves shortly after a release.",
          ),
          figure("platformUpdates", "One update, applied."),
          p(
            "Each is listed with when it ran and what it changed. Check shows what a pending one would change; Apply now runs it straight away.",
          ),
          h("Database maintenance"),
          p(
            "Every Sunday a check-up looks for data pointing at deleted things (a task whose event is gone, a group that no longer exists) and photos nothing uses, and saves a report.",
          ),
          figure("maintenance", "Reporting only, until it's turned on."),
          p(
            "It only reports until an Administrator turns on Apply the fixes; Run now runs it straight away. It never deletes real work: finished tasks stay as history.",
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
          p("Click your name at the bottom of the menu."),
          figure(
            "accountPage",
            "Your account.",
            callout("Your photo", "Drag and zoom to frame it."),
            callout(
              "Your names",
              "Your in-game name is shown first wherever you appear.",
            ),
            callout(
              "Your time and formats",
              "Times show in your time zone, with your date format and clock. Your theme is here too.",
            ),
            callout(
              "Notifications and password",
              "Choose what you're notified about, and change your password.",
            ),
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
    [article.title, article.summary, ...article.body.flatMap(blockWords)]
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

/** The words in a block, for search: pictures count by what's said about them. */
function blockWords(block: Block): string[] {
  switch (block.kind) {
    case "p":
    case "h":
    case "tip":
      return [block.text];
    case "steps":
    case "list":
      return [...block.items];
    case "figure":
      return [
        block.caption,
        ...block.callouts.flatMap((entry) => [entry.title, entry.text]),
      ];
    case "frames":
      return block.items.map((item) => item.text);
    case "compare":
      return [block.note];
  }
}
