// File : /TeamSamsara.Workflow/scripts/seedEmulator.mjs
// Version : 1.12.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Fills the local emulators with a ready-made workspace and test
// accounts, so the app can be tried without touching the real project. It wipes
// the emulators first. Run it while `npm run emulators` is running: npm run seed

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
// Node strips the types from this file as it loads it, so the seed starts from
// the same roles as a real first-time setup.
import {
  AdminRoleId,
  defaultRoles,
} from "../app/src/core/workspace/seed/defaultRoles.ts";
import { defaultStatuses } from "../app/src/core/workspace/seed/defaultStatuses.ts";

// #region Settings
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const firebaseConfig = JSON.parse(
  readFileSync(path.join(repoRoot, "firebase.json"), "utf8"),
);
const firebaseProjects = JSON.parse(
  readFileSync(path.join(repoRoot, ".firebaserc"), "utf8"),
);

// `firebase emulators:exec` sets GCLOUD_PROJECT; otherwise use the project the app points at.
const projectId =
  process.env.GCLOUD_PROJECT ?? firebaseProjects.projects.default;
const authEmulator = `http://${firebaseConfig.emulators.auth.host}:${firebaseConfig.emulators.auth.port}`;
const firestoreEmulator = firebaseConfig.emulators.firestore;

/** Every seeded account uses this password. Emulator only: never a real one. */
const devPassword = "Workflow-dev-1";
// #endregion

// #region Seed data
/** Admin moves up one place, so the extra role below sits between it and Everyone. */
const startingRoles = defaultRoles.map((role) =>
  role.id === AdminRoleId ? { ...role, position: role.position + 1 } : role,
);

/** A role with only some workspace settings, to try a partial Settings area. */
const peopleManagerRole = {
  id: "peopleManager",
  name: "People manager",
  color: "#3E8ED0",
  description: "Invites members and arranges work groups.",
  position: 1,
  permissions: ["manageMembers", "manageWorkGroups"],
};

/** Two work groups, so group pickers and cards have something to show. */
const workGroups = [
  {
    id: "design",
    name: "Design",
    description: "Graphics, overlays and brand assets.",
  },
  {
    id: "video",
    name: "Video",
    description: "Edits highlights and clips.",
  },
];

const due = (direction, days, hours, time = null) => ({
  direction,
  days,
  hours,
  minutes: 0,
  time,
});
const step = (id, fields) => ({
  id,
  title: "",
  notes: "",
  workGroupId: null,
  memberId: null,
  due: due("before", 1, 0),
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: null,
  links: null,
  asksForLiveLink: false,
  ...fields,
});

/** One workflow with a task of each kind, to try the editor on. */
/** One event type, so the calendar has a colour to show (real workspaces start with none). */
const seedTimeZone = "America/Toronto";
const matchType = { name: "Match", color: "#E5484D", position: 0 };
const meetingType = { name: "Meeting", color: "#3E8EF7", position: 1 };

/**
 * A weekly meeting every Monday and Thursday. Only the repeat is written: the
 * calendar makes its events the first time a planner opens it.
 */
function sampleRepeat(now, uidOf, timeZone) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  return {
    title: "Weekly content meeting",
    eventTypeId: "meeting",
    weekdays: [1, 4],
    time: "10:00",
    minutes: 60,
    startDate: today,
    endKind: "never",
    endDate: null,
    endCount: null,
    skipDates: [],
    link: null,
    details: {},
    notes: "Plan the week's posts and clips.",
    workflowIds: [],
    everyone: true,
    groupIds: [],
    memberIds: [],
    createdBy: uidOf("alex"),
    createdAt: now,
    updatedAt: now,
  };
}

const sampleWorkflow = {
  name: "Match day",
  description: "Graphics, posts and clips around each match.",
  eventTypeId: "match",
  archived: false,
  steps: [
    step("graphic", {
      title: "Matchday graphic",
      notes: "Both team logos, the match time and where to watch.",
      workGroupId: "design",
      due: due("before", 2, 0, "19:00"),
      needsApproval: true,
      checklist: [
        { id: "c1", text: "Both team logos" },
        { id: "c2", text: "Match time in our time zone" },
      ],
      links: [{ label: "Brand kit", url: "https://example.com/brand" }],
    }),
    step("announce", {
      title: "Announcement post",
      notes: "Post with the graphic once it's approved.",
      due: due("before", 1, 0),
      posts: [
        {
          platformId: "x",
          formatId: null,
          texts: {
            post: "Matchday! {title} vs {opponent} at {time}. Watch: {link}",
          },
        },
      ],
      asksForLiveLink: true,
    }),
    step("clip", {
      title: "Highlights clip",
      workGroupId: "video",
      due: due("after", 1, 0),
    }),
  ],
};

const hour = 60 * 60 * 1000;

/** A few standalone tasks, so My tasks has something in each group. */
function sampleTasks(now, uidOf) {
  const task = (fields) => ({
    title: "",
    notes: "",
    workGroupId: null,
    memberId: null,
    dueAt: null,
    statusId: "status1",
    needsApproval: false,
    tagIds: [],
    posts: null,
    checklist: null,
    links: null,
    asksForLiveLink: false,
    liveLink: null,
    eventId: null,
    workflowId: null,
    stepId: null,
    sentForReviewBy: null,
    sentForReviewAt: null,
    approvedBy: null,
    approvedAt: null,
    changesRequested: null,
    createdBy: uidOf("alex"),
    createdAt: now,
    updatedAt: now,
    doneAt: null,
    ...fields,
  });
  const inHours = (hours) => new Date(now.getTime() + hours * hour);
  return {
    recap: task({
      title: "Weekly recap post",
      memberId: uidOf("alex"),
      dueAt: inHours(-3),
    }),
    graphic: task({
      title: "Matchday graphic",
      notes: "Both team logos, the match time and where to watch.",
      workGroupId: "design",
      dueAt: inHours(4),
      needsApproval: true,
      checklist: [
        { id: "c1", text: "Both team logos", done: true },
        { id: "c2", text: "Match time in our time zone", done: false },
      ],
      links: [{ label: "Brand kit", url: "https://example.com/brand" }],
    }),
    sponsor: task({
      title: "Sponsor post",
      notes: "Use the sponsor's approved wording and tag their account.",
      memberId: uidOf("sam"),
      dueAt: inHours(48),
      needsApproval: true,
      asksForLiveLink: true,
      statusId: "status2",
      sentForReviewBy: uidOf("sam"),
      sentForReviewAt: inHours(-1),
      posts: [
        {
          platformId: "x",
          formatId: null,
          texts: {
            post: "Big news: we're partnering with Nova Energy for the rest of the season.",
          },
        },
      ],
    }),
    clip: task({
      title: "Highlights clip",
      workGroupId: "video",
      dueAt: inHours(24 * 5),
    }),
    notes: task({
      title: "Team meeting notes",
      memberId: uidOf("alex"),
    }),
    done: task({
      title: "Update the brand kit",
      workGroupId: "design",
      dueAt: inHours(-48),
      statusId: "status4",
      doneAt: inHours(-50),
    }),
  };
}

/** A match in three days with two of its tasks, as if planned with Match day. */
function sampleEvent(now, uidOf) {
  const startsAt = new Date(
    Math.ceil((now.getTime() + 72 * hour) / hour) * hour,
  );
  const event = {
    title: "vs. Team Nova",
    eventTypeId: "match",
    startsAt,
    link: "https://twitch.tv/teamsamsara",
    details: { opponent: "Team Nova" },
    workflowIds: ["match-day"],
    notes: "",
    repeatId: null,
    endsAt: new Date(startsAt.getTime() + 2 * hour),
    everyone: true,
    groupIds: [],
    memberIds: [],
    createdBy: uidOf("alex"),
    createdAt: now,
    updatedAt: now,
  };
  const eventTask = (stepId, fields) => ({
    ...sampleTasks(now, uidOf).recap,
    memberId: null,
    eventId: "nova",
    workflowId: "match-day",
    stepId,
    ...fields,
  });
  return {
    event,
    tasks: {
      novaGraphic: eventTask("graphic", {
        title: "Matchday graphic",
        workGroupId: "design",
        dueAt: new Date(startsAt.getTime() - 48 * hour),
        needsApproval: true,
      }),
      novaAnnounce: eventTask("announce", {
        title: "Announcement post",
        dueAt: new Date(startsAt.getTime() - 24 * hour),
        posts: [
          {
            platformId: "x",
            formatId: null,
            texts: {
              post: "Matchday! We play Team Nova tonight. Watch: https://twitch.tv/teamsamsara",
            },
          },
        ],
        asksForLiveLink: true,
      }),
    },
  };
}

/** status null = an account with no member record (never invited). */
const accounts = [
  {
    key: "alex",
    name: "Alex Moreau",
    status: "active",
    roleIds: [AdminRoleId],
    note: "Admin",
  },
  {
    key: "jordan",
    name: "Jordan Blake",
    status: "active",
    roleIds: ["peopleManager"],
    workGroupIds: ["video"],
    note: "People manager: Members and Work groups settings only",
  },
  {
    key: "sam",
    name: "Sam Rivera",
    status: "active",
    roleIds: [],
    workGroupIds: ["design", "video"],
    note: "Member, Everyone role only",
  },
  {
    key: "mika",
    name: "Mika Tanaka",
    status: "invited",
    roleIds: [],
    note: "Invited, becomes active on first sign-in",
  },
  {
    key: "chris",
    name: "Chris Novak",
    status: "disabled",
    roleIds: [],
    note: "Access turned off",
  },
  {
    key: "stranger",
    name: "Stranger",
    status: null,
    roleIds: [],
    note: "Signed up without an invite",
  },
];
// #endregion

// #region Helpers
function emailFor(key) {
  return `${key}@example.test`;
}

/** Same index the app builds: permission key -> ids of the roles that grant it. */
function buildPermissionGrants(roles) {
  const grants = {};
  for (const role of [...roles].sort((a, b) => a.id.localeCompare(b.id))) {
    for (const permission of new Set(role.permissions)) {
      (grants[permission] ??= []).push(role.id);
    }
  }
  return grants;
}

async function authRequest(method, route, body) {
  const response = await fetch(`${authEmulator}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer owner",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(
      `Auth emulator ${method} ${route} failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

function createAccount(account) {
  return authRequest(
    "POST",
    "/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator",
    {
      email: emailFor(account.key),
      password: devPassword,
      displayName: account.name,
    },
  );
}
// #endregion

async function main() {
  console.log(`Seeding the emulators for project "${projectId}"...`);

  await authRequest("DELETE", `/emulator/v1/projects/${projectId}/accounts`);
  const created = [];
  for (const account of accounts) {
    const { localId } = await createAccount(account);
    created.push({ ...account, uid: localId });
  }

  const env = await initializeTestEnvironment({
    projectId,
    firestore: { host: firestoreEmulator.host, port: firestoreEmulator.port },
  });
  await env.clearFirestore();

  const now = new Date();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const roles = [...startingRoles, peopleManagerRole];
    const writes = [
      // The same starting statuses as a real setup; tags start empty.
      ...defaultStatuses.map((status, index) =>
        db.doc(`statuses/status${index + 1}`).set(status),
      ),
      db.doc("workflows/match-day").set({
        ...sampleWorkflow,
        createdAt: now,
        updatedAt: now,
      }),
      ...workGroups.map(({ id, ...group }) =>
        db.doc(`workGroups/${id}`).set({ ...group, createdAt: now }),
      ),
      db.doc("config/workspace").set({
        name: "Team Samsara (dev)",
        timeZone: seedTimeZone,
        weekStartsOn: "monday",
        dateFormat: "weekdayMonthDay",
        timeFormat: "12h",
        defaultTheme: "device",
        enabledPlatformIds: ["x", "instagram", "youtube", "tiktok", "twitch"],
        upgradedPlatformIds: [],
        createdAt: now,
      }),
      db.doc("config/roles").set({
        roles: Object.fromEntries(roles.map(({ id, ...role }) => [id, role])),
        grants: buildPermissionGrants(roles),
      }),
    ];
    const uidOf = (key) => created.find((account) => account.key === key).uid;
    for (const [id, task] of Object.entries(sampleTasks(now, uidOf))) {
      writes.push(db.doc(`tasks/${id}`).set(task));
    }
    const nova = sampleEvent(now, uidOf);
    writes.push(db.doc("eventTypes/match").set(matchType));
    writes.push(db.doc("eventTypes/meeting").set(meetingType));
    writes.push(
      db
        .doc("repeats/weekly-meeting")
        .set(sampleRepeat(now, uidOf, seedTimeZone)),
    );
    writes.push(db.doc("events/nova").set(nova.event));
    for (const [id, task] of Object.entries(nova.tasks)) {
      writes.push(db.doc(`tasks/${id}`).set(task));
    }
    for (const account of created) {
      if (account.status === null) continue;
      writes.push(
        db.doc(`members/${account.uid}`).set({
          displayName: account.name,
          email: emailFor(account.key),
          status: account.status,
          roleIds: account.roleIds,
          workGroupIds: account.workGroupIds ?? [],
          timeZone: null,
          invitedBy: null,
          invitedAt: now,
          joinedAt: account.status === "active" ? now : null,
          lastActiveAt: null,
        }),
      );
    }
    await Promise.all(writes);
  });
  await env.cleanup();

  console.log(`\nDone. Every account's password is ${devPassword}\n`);
  console.table(
    created.map((account) => ({
      email: emailFor(account.key),
      what: account.note,
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
