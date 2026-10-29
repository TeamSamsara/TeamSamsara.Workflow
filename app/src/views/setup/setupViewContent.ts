// File : /TeamSamsara.Workflow/app/src/views/setup/setupViewContent.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The words on the first-time setup page.

export const SetupViewText = {
  steps: {
    label: "Setup steps",
    workspace: "Workspace",
    account: "Your account",
    done: "Done",
  },
  title: "Set up your workspace",
  description:
    "This only shows once, on a brand-new install. You become its first Admin.",
  loading: "Getting setup ready",
  doneTitle: "Your workspace is ready",
  doneDescription: (workspaceName: string) =>
    `${workspaceName} is set up, and you're its Admin. Next, invite your team from Settings.`,
  openApp: "Open Workflow",
} as const;

export const SetupFormText = {
  workspaceHeading: "Workspace",
  workspaceName: "Workspace name",
  workspaceNameHint:
    "Shown in the sidebar and in emails. You can change it later.",
  timeZone: "Time zone",
  timeZoneHint: "Events are planned in this time zone.",
  weekStartsOn: "Week starts on",
  weekStarts: { monday: "Monday", sunday: "Sunday" },
  timeFormat: "Time format",
  timeFormats: { "12h": "12-hour (2:30 PM)", "24h": "24-hour (14:30)" },
  next: "Continue",

  accountHeading: "Your account",
  yourName: "Your name",
  email: "Email",
  password: "Password",
  confirmation: "Confirm password",
  signedInAs: (email: string) =>
    `You're signed in as ${email}. This account becomes the Admin.`,
  useAnotherAccount: "Use another account",
  back: "Back",
  submit: "Create workspace",

  errors: {
    offline: "You seem to be offline. Check your connection and try again.",
    notAllowed:
      "The workspace couldn't be created. Someone may have set it up already.",
    unknown: "Something went wrong. Try again in a moment.",
  },
} as const;
