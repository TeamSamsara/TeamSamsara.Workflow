// File : /TeamSamsara.Workflow/functions/src/emails/templates.ts
// Version : 1.0.0
// Latest commit: feature/branded-emails
// Author : Gerrah
// Purpose : Every email Playbook sends, built on the shared layout: the
// invite, the forgot-password email, the test email, and one per kind of
// notification. Each gives back its subject, the HTML and a plain-text copy.

import type { NotificationKind, SettingGroup } from "../model.js";
import { SettingGroupOf } from "../model.js";
import { answerWords, sentence, type Said } from "../text.js";
import {
  box,
  button,
  buttonRow,
  card,
  emailPage,
  eyebrow,
  heading,
  html,
  join,
  paragraph,
  quote,
  strong,
  words,
  type Html,
} from "./layout.js";

export interface Email {
  subject: string;
  html: string;
  text: string;
}

/** What every email needs to know about where it comes from. */
export interface Sender {
  /** The workspace's name ("Team Samsara"). */
  workspace: string;
  /** Playbook's web address, without a trailing slash. */
  appUrl: string;
}

const plainLink = (url: string): Html =>
  words(
    "Button not working? Open ",
    html(
      `<a href="${url.replace(/"/g, "&quot;")}" style="color:#3d6b1f;word-break:break-all">${url.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>`,
    ),
  );

const lines = (...parts: (string | null | false)[]) =>
  parts.filter((part) => part !== null && part !== false).join("\n");

// #region Account emails

export function inviteEmail(
  from: Sender,
  to: { email: string; inviter: string | null; link: string },
): Email {
  const who = to.inviter ?? "Your team";
  const subject = `${who} invited you to ${from.workspace}'s Playbook`;
  return {
    subject,
    html: emailPage({
      ...from,
      preview: "Choose your password to get started.",
      body: join(
        heading("Welcome to your", "playbook", 44),
        paragraph(
          words(
            strong(who),
            ` invited you to ${from.workspace}'s Playbook: your new team workspace for managing events, tasks and availability, all in one place.`,
          ),
          "lead",
        ),
        paragraph(
          words(
            "Choose a password for ",
            strong(to.email),
            ", then sign in with this email from now on.",
          ),
        ),
        button("Choose my password", to.link),
        box(
          "What's waiting for you",
          "Your calendar, the tasks given to you, and a short walkthrough the first time you sign in.",
        ),
        paragraph(
          `This link works once and expires after a while. If it runs out, ask ${who === "Your team" ? "an admin" : who} to send the invite again.`,
          "small",
        ),
      ),
      footer: [
        "Weren't expecting this? You can ignore it: nothing happens until the link is used.",
        plainLink(to.link),
      ],
    }),
    text: lines(
      subject,
      "",
      `${who} invited you to ${from.workspace}'s Playbook: your new team workspace for managing events, tasks and availability, all in one place.`,
      `Choose a password for ${to.email}, then sign in with this email from now on:`,
      to.link,
      "",
      "Weren't expecting this? You can ignore it: nothing happens until the link is used.",
    ),
  };
}

export function resetEmail(
  from: Sender,
  to: { email: string; link: string },
): Email {
  const subject = "Choose a new Playbook password";
  return {
    subject,
    html: emailPage({
      ...from,
      preview: "Someone asked to reset the password for this email.",
      body: join(
        heading("Choose a new password"),
        paragraph(
          words(
            "We got a request to reset the Playbook password for ",
            strong(to.email),
            ".",
          ),
          "lead",
        ),
        button("Choose a new password", to.link),
        paragraph(
          "This link works once and expires after a while. Your current password keeps working until you choose a new one.",
          "small",
        ),
        box(
          "Didn't ask for this?",
          "Ignore this email: your password stays the same. If it keeps happening, tell an admin on your team.",
          "warn",
        ),
      ),
      footer: [plainLink(to.link)],
    }),
    text: lines(
      subject,
      "",
      `We got a request to reset the Playbook password for ${to.email}. Choose a new one here:`,
      to.link,
      "",
      "Didn't ask for this? Ignore this email: your password stays the same.",
    ),
  };
}

export function testEmail(from: Sender, to: { email: string }): Email {
  const subject = "Your Playbook emails work";
  const settings = `${from.appUrl}/account#notifications`;
  return {
    subject,
    html: emailPage({
      ...from,
      preview: "This is the test you asked for.",
      body: join(
        heading("Your emails work"),
        paragraph(
          words(
            "You asked Playbook to send a test, and here it is. Notifications you've turned on for email will arrive here, at ",
            strong(to.email),
            ".",
          ),
          "lead",
        ),
        box(
          "Not seeing them later?",
          "Check spam once and mark Playbook as safe. Each kind of email can be switched on or off in Your account › Notifications.",
        ),
        button("Notification settings", settings, "dark"),
      ),
      footer: ['Sent because you pressed "Send me a test email" in Playbook.'],
    }),
    text: lines(
      subject,
      "",
      `Notifications you've turned on for email will arrive here, at ${to.email}.`,
      `Notification settings: ${settings}`,
    ),
  };
}

// #endregion

// #region Notifications

/** The rows of Your account › Notifications, named the same. */
const settingNames: Record<SettingGroup, string> = {
  given: "A task is given to me or my group",
  mine: "My task is approved or sent back",
  review: "A task is sent to me to review",
  events: "I'm added to an event, or one I'm in changes",
};

interface KindLook {
  eyebrow: string;
  button: string;
  /** Where the detail goes: a time under the name, or a quote. */
  detail: "when" | "quote" | "none";
  /** What the time means, before it ("Due", "Now"). */
  whenLabel?: string;
}

const kinds: Record<NotificationKind, KindLook> = {
  taskGiven: { eyebrow: "New task", button: "Open the task", detail: "none" },
  reviewAsked: {
    eyebrow: "Review needed",
    button: "Review it",
    detail: "none",
  },
  taskApproved: {
    eyebrow: "Approved",
    button: "Open the task",
    detail: "none",
  },
  changesAsked: {
    eyebrow: "Changes asked",
    button: "Open the task",
    detail: "quote",
  },
  eventAdded: {
    eyebrow: "You're in an event",
    button: "Open the event",
    detail: "none",
  },
  eventMoved: {
    eyebrow: "Event moved",
    button: "Open the event",
    detail: "when",
    whenLabel: "Now",
  },
  eventCancelled: {
    eyebrow: "Event cancelled",
    button: "Open your calendar",
    detail: "none",
  },
  taskDue: {
    eyebrow: "Reminder",
    button: "Open the task",
    detail: "when",
    whenLabel: "Due",
  },
  eventSoon: {
    eyebrow: "Reminder",
    button: "Open the event",
    detail: "when",
    whenLabel: "Starts",
  },
  replyAsked: {
    eyebrow: "Are you going?",
    button: "Open the event",
    detail: "when",
  },
  replyDeclined: {
    eyebrow: "Can't make it",
    button: "See who's coming",
    detail: "quote",
  },
  replied: {
    eyebrow: "New reply",
    button: "See who's coming",
    detail: "quote",
  },
};

export interface NotificationEmail {
  kind: NotificationKind;
  said: Said;
  /** Where its button goes (the task, the event, or the calendar). */
  link: string;
}

export function notificationEmail(
  from: Sender,
  note: NotificationEmail,
): Email {
  const look = kinds[note.kind];
  const subject = sentence(note.kind, note.said);
  const detail = note.said.detail?.trim() || null;
  const when = look.detail === "when" ? detail : null;
  const said = look.detail === "quote" ? detail : null;
  const settings = `${from.appUrl}/account#notifications`;
  const sub = when
    ? look.whenLabel
      ? `${look.whenLabel}: ${when}`
      : when
    : note.said.group
      ? `For ${note.said.group}`
      : null;

  // Asked to reply: answer straight from the email.
  const answers =
    note.kind === "replyAsked"
      ? buttonRow(
          (["going", "maybe", "cant"] as const).map((answer) => ({
            label: answerWords[answer],
            href: `${note.link}?reply=${answer}`,
          })),
        )
      : null;

  return {
    subject,
    html: emailPage({
      ...from,
      preview: when ?? said ?? look.eyebrow,
      body: join(
        eyebrow(look.eyebrow),
        paragraph(`${subject}.`, "lead"),
        card(note.said.title, sub),
        said ? quote(said, note.said.actor ?? undefined) : null,
        answers,
        answers
          ? paragraph(
              "Pick one to reply; you can add a note or change it on the event page.",
              "small",
            )
          : button(look.button, note.link),
      ),
      footer: [
        words(
          `You get this because "${settingNames[SettingGroupOf[note.kind]]}" is on for email. `,
          html(
            `<a href="${settings}" style="color:#3d6b1f">Change what Playbook emails you</a>`,
          ),
        ),
        plainLink(note.link),
      ],
    }),
    text: lines(
      `${subject}.`,
      sub,
      said ? `“${said}”` : null,
      "",
      `${look.button}: ${note.link}`,
      "",
      `Change what Playbook emails you: ${settings}`,
    ),
  };
}

// #endregion
