// File : /TeamSamsara.Workflow/functions/src/emails/layout.ts
// Version : 1.0.0
// Latest commit: feature/branded-emails
// Author : Gerrah
// Purpose : The look every Playbook email shares: a dark header with the logo
// and wordmark, a white card, a footer, and the pieces the emails are built
// from (heading, paragraph, button, boxes, a card for a task or event). Built
// from tables with inline styles, which is what email apps reliably show.
// Every piece escapes the text it is given; html() marks text already built.

/** Colours and type, the same as the app's. */
export const EmailLook = {
  ink: "#151d23",
  body: "#3a434b",
  muted: "#5b636a",
  faint: "#8a8f94",
  line: "#ececec",
  border: "#dcd8d8",
  page: "#eeeeee",
  soft: "#f3f3f3",
  accent: "#95ff50",
  accentInk: "#3d6b1f",
  warnBg: "#fff3cf",
  warnInk: "#4d3800",
  goodBg: "#eaf9dc",
  goodInk: "#2c4f15",
  display: "'Anton', Impact, 'Arial Narrow Bold', sans-serif",
  text: "'DM Sans', Arial, Helvetica, sans-serif",
} as const;

const L = EmailLook;

/** Text that is already HTML (built by these pieces), so it isn't escaped again. */
export interface Html {
  readonly html: string;
}

export const html = (value: string): Html => ({ html: value });

export function escape(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

type Content = string | Html;
const out = (value: Content) =>
  typeof value === "string" ? escape(value) : value.html;

/** Several pieces in a row of the body. */
export const join = (...parts: (Html | null | false)[]): Html =>
  html(
    parts
      .filter((part): part is Html => Boolean(part))
      .map((part) => part.html)
      .join(""),
  );

/** Bold words inside a paragraph. */
export const strong = (value: string): Html => html(`<b>${escape(value)}</b>`);

/** A mix of plain text and pieces, joined. */
export const words = (...parts: Content[]): Html =>
  html(parts.map(out).join(""));

const block = (inner: string, gap = 18) =>
  html(`<tr><td style="padding:0 0 ${gap}px 0">${inner}</td></tr>`);

export const eyebrow = (value: string): Html =>
  block(
    `<div style="font-family:${L.text};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${L.accentInk}">${escape(value)}</div>`,
    10,
  );

/** The big uppercase title; `highlight` is drawn in green at the end. */
export const heading = (value: string, highlight?: string, size = 40): Html =>
  block(
    `<h1 style="margin:0;font-family:${L.display};font-weight:400;font-size:${size}px;line-height:1.05;text-transform:uppercase;color:${L.ink}">${escape(value)}${highlight ? ` <span style="color:${L.accentInk}">${escape(highlight)}</span>` : ""}</h1>`,
  );

export const paragraph = (
  value: Content,
  tone: "lead" | "body" | "small" = "body",
): Html => {
  const style = {
    lead: `font-size:16px;color:${L.ink}`,
    body: `font-size:15px;color:${L.body}`,
    small: `font-size:13px;color:${L.muted}`,
  }[tone];
  return block(
    `<p style="margin:0;font-family:${L.text};line-height:1.55;${style}">${out(value)}</p>`,
  );
};

/** The main action. Dark for the secondary kind. */
export const button = (
  label: string,
  href: string,
  kind: "primary" | "dark" = "primary",
): Html => {
  const [bg, fg] = kind === "primary" ? [L.accent, L.ink] : [L.ink, "#ffffff"];
  return block(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:${bg}">` +
      `<a href="${escape(href)}" style="display:inline-block;padding:14px 26px;font-family:${L.display};font-size:18px;letter-spacing:0.5px;text-transform:uppercase;color:${fg};text-decoration:none;border-radius:10px">${escape(label)}</a>` +
      `</td></tr></table>`,
    20,
  );
};

/** Answer buttons side by side (Going / Maybe / Can't go). */
export const buttonRow = (
  items: readonly { label: string; href: string }[],
): Html =>
  block(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${items
      .map(
        (item, index) =>
          `<td style="padding:0 ${index < items.length - 1 ? 8 : 0}px 0 0"><a href="${escape(item.href)}" style="display:inline-block;white-space:nowrap;padding:12px 16px;border:1px solid #c2bcbc;border-radius:10px;font-family:${L.display};font-size:17px;letter-spacing:0.5px;text-transform:uppercase;color:${L.ink};text-decoration:none;background:#ffffff">${escape(item.label)}</a></td>`,
      )
      .join("")}</tr></table>`,
    20,
  );

/** A tinted box with a bold title and a line under it. */
export const box = (
  title: string,
  body: Content,
  tone: "soft" | "warn" | "good" = "soft",
): Html => {
  const [bg, fg, sub] = {
    soft: [L.soft, L.ink, L.body],
    warn: [L.warnBg, L.warnInk, L.warnInk],
    good: [L.goodBg, L.goodInk, L.goodInk],
  }[tone];
  return block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:16px 18px;background:${bg};border-radius:10px;font-family:${L.text};font-size:14px;line-height:1.5">` +
      `<div style="font-weight:700;color:${fg};margin:0 0 4px">${escape(title)}</div><div style="color:${sub}">${out(body)}</div>` +
      `</td></tr></table>`,
  );
};

/** Someone's own words: a note, a reason, what a reviewer asked for. */
export const quote = (value: string, who?: string): Html =>
  block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:14px 18px;background:${L.soft};border-radius:10px;font-family:${L.text};font-size:15px;line-height:1.5;color:${L.ink}">` +
      `“${escape(value)}”${who ? `<div style="margin-top:6px;font-size:12.5px;color:${L.muted}">${escape(who)}</div>` : ""}` +
      `</td></tr></table>`,
  );

/** A task or event: its name, a line under it, and up to two facts below. */
export const card = (
  title: string,
  sub: Content | null,
  facts: readonly { label: string; value: string }[] = [],
): Html => {
  const shown = facts.slice(0, 2);
  const factRow = shown.length
    ? `<tr><td style="border-top:1px solid ${L.line}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${shown
        .map(
          (fact, index) =>
            `<td width="${Math.floor(100 / shown.length)}%" style="padding:12px 20px;font-family:${L.text};font-size:13.5px;color:${L.ink};${index > 0 ? `border-left:1px solid ${L.line};` : ""}vertical-align:top"><div style="font-size:12px;color:${L.muted}">${escape(fact.label)}</div><b>${escape(fact.value)}</b></td>`,
        )
        .join("")}</tr></table></td></tr>`
    : "";
  return block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${L.border};border-radius:12px;border-collapse:separate">` +
      `<tr><td style="padding:18px 20px"><div style="font-family:${L.display};font-size:24px;line-height:1.1;text-transform:uppercase;color:${L.ink}">${escape(title)}</div>` +
      (sub
        ? `<div style="margin-top:6px;font-family:${L.text};font-size:14px;color:${L.body}">${out(sub)}</div>`
        : "") +
      `</td></tr>${factRow}</table>`,
  );
};

export interface EmailPage {
  /** The line inbox lists show after the subject. */
  preview: string;
  /** Who the emails are from, shown at the top right ("Team Samsara"). */
  workspace: string;
  /** Where the logo is served (the app's address). */
  appUrl: string;
  body: Html;
  /** Small lines at the bottom: why they got it, a plain link. */
  footer: readonly Content[];
}

/** A whole email: the header, the card with the body, the footer. */
export function emailPage(page: EmailPage): string {
  const logo = `${page.appUrl.replace(/\/+$/, "")}/Samsara_Icon.png`;
  const footer = [...page.footer, `${page.workspace} · Playbook`]
    .map(
      (line, index, all) =>
        `<div style="margin:0 0 ${index < all.length - 1 ? 6 : 0}px;${index === all.length - 1 ? `color:${L.faint}` : ""}">${out(line)}</div>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Playbook</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${L.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(page.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${L.page}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;border-collapse:separate;overflow:hidden">
<tr><td style="background:${L.ink};padding:20px 32px;border-radius:14px 14px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="52" style="vertical-align:middle"><img src="${escape(logo)}" width="40" height="32" alt="" style="display:block;border:0;width:40px;height:32px"></td>
<td style="vertical-align:middle;font-family:${L.display};font-size:22px;letter-spacing:0.5px;color:#ffffff">PLAYBOOK</td>
<td align="right" style="vertical-align:middle;font-family:${L.text};font-size:12px;color:#a9b0b6">${escape(page.workspace)}</td>
</tr></table>
</td></tr>
<tr><td style="padding:34px 32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${page.body.html}</table>
</td></tr>
<tr><td style="border-top:1px solid ${L.line};padding:18px 32px 22px;font-family:${L.text};font-size:12px;line-height:1.5;color:${L.muted}">${footer}</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}
