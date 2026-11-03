// File : /TeamSamsara.Workflow/functions/src/emails/templates.test.ts
// Version : 1.0.0
// Latest commit: feature/branded-emails
// Author : Gerrah
// Purpose : The emails carry the right words and links, and never let a
// name or note turn into HTML.

import { describe, expect, it } from "vitest";
import {
  inviteEmail,
  notificationEmail,
  resetEmail,
  testEmail,
} from "./templates.js";

const from = { workspace: "Team Samsara", appUrl: "https://playbook.test" };

describe("account emails", () => {
  it("invites with the inviter, the workspace and the link", () => {
    const email = inviteEmail(from, {
      email: "mika@example.com",
      inviter: "Gerrah",
      link: "https://playbook.test/auth/link?mode=resetPassword&oobCode=abc",
    });
    expect(email.subject).toBe("Gerrah invited you to Team Samsara's Playbook");
    expect(email.html).toContain("Choose my password");
    expect(email.html).toContain("oobCode=abc");
    expect(email.html).toContain("https://playbook.test/Samsara_Icon.png");
    expect(email.text).toContain("mika@example.com");
  });

  it("says who without an inviter", () => {
    const email = inviteEmail(from, {
      email: "a@b.c",
      inviter: null,
      link: "x",
    });
    expect(email.subject).toBe(
      "Your team invited you to Team Samsara's Playbook",
    );
  });

  it("resets and tests", () => {
    expect(resetEmail(from, { email: "a@b.c", link: "x" }).subject).toBe(
      "Choose a new Playbook password",
    );
    expect(testEmail(from, { email: "a@b.c" }).html).toContain(
      "https://playbook.test/account#notifications",
    );
  });
});

describe("notification emails", () => {
  it("escapes names and notes", () => {
    const email = notificationEmail(from, {
      kind: "changesAsked",
      said: {
        actor: "<b>Jordan</b>",
        title: "Post & story",
        detail: "Use the <new> logo",
        group: null,
      },
      link: "https://playbook.test/tasks/t1",
    });
    expect(email.html).not.toContain("<b>Jordan</b>");
    expect(email.html).toContain("&lt;b&gt;Jordan&lt;/b&gt;");
    expect(email.html).toContain("Use the &lt;new&gt; logo");
    expect(email.html).toContain("Post &amp; story");
  });

  it("lets people reply to an event from the email", () => {
    const email = notificationEmail(from, {
      kind: "replyAsked",
      said: {
        actor: "Jordan",
        title: "vs. Kitsune",
        detail: "Sat, Nov 14, 7:00 PM",
        group: null,
      },
      link: "https://playbook.test/events/e1",
    });
    for (const answer of ["going", "maybe", "cant"])
      expect(email.html).toContain(`/events/e1?reply=${answer}`);
    expect(email.subject).toBe("Jordan asked you to reply to vs. Kitsune");
  });

  it("names the setting that sent it", () => {
    const email = notificationEmail(from, {
      kind: "eventSoon",
      said: {
        actor: null,
        title: "Practice",
        detail: "in 1 hour",
        group: null,
      },
      link: "https://playbook.test/events/e2",
    });
    expect(email.html).toContain(
      "I&#39;m added to an event, or one I&#39;m in changes",
    );
    expect(email.text).toContain("Starts: in 1 hour");
  });
});
