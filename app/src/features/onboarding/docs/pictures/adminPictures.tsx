// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/adminPictures.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Pictures for settings and your account: inviting people, a
// member's access, roles and their permissions, work groups, the workspace's
// time and look, platform updates, database maintenance and Your account.

import type { CSSProperties } from "react";
import {
  Check,
  Chip,
  Face,
  FakeButton,
  Field,
  Panel,
  Row,
  Scene,
  Segments,
  Small,
  Spot,
  Switch,
  Text,
} from "./kit";

const wrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
};

const dot = (color: string): CSSProperties => ({
  width: 10,
  height: 10,
  flexShrink: 0,
  borderRadius: 999,
  background: color,
});

export function InviteDialog() {
  return (
    <Scene>
      <Panel pop title="Invite people">
        <Row>
          <Spot n={1}>
            <span style={wrap}>
              <Chip tone="outline">okami@example.com</Chip>
              <Chip tone="outline">saltyvl@example.com</Chip>
              <Small>Add another email</Small>
            </span>
          </Spot>
        </Row>
        <Row>
          <Spot n={2}>
            <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Small>Roles</Small>
              <span style={{ ...wrap, gap: 12 }}>
                <Check on>Player</Check>
                <Check>Planner</Check>
              </span>
              <Small>Work groups</Small>
              <span style={{ ...wrap, gap: 12 }}>
                <Check on>Players</Check>
                <Check>Marketing</Check>
              </span>
            </span>
          </Spot>
        </Row>
        <Row>
          <Spot n={3}>
            <Text
              title="Their walkthrough"
              sub="My tasks, the calendar, your availability"
            />
          </Spot>
        </Row>
        <Row>
          <span style={{ ...wrap, marginLeft: "auto" }}>
            <FakeButton>Cancel</FakeButton>
            <FakeButton primary>Invite</FakeButton>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function MemberAccess() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Face initials="OK" />
          <Text title="Okami" sub="okami@example.com" />
          <Chip tone="info">Invited</Chip>
        </Row>
        <Row>
          <Small>Roles</Small>
          <span style={wrap}>
            <Chip tone="neutral">Player</Chip>
          </span>
        </Row>
        <Row>
          <Small>Work groups</Small>
          <span style={wrap}>
            <Chip tone="neutral">Players</Chip>
          </span>
        </Row>
        <Row>
          <span style={wrap}>
            <FakeButton>Resend invite</FakeButton>
            <FakeButton>Turn off access</FakeButton>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function RolesList() {
  const roles: [string, string, string][] = [
    ["Administrator", "var(--palette-blue)", "Can do everything."],
    ["Planner", "var(--palette-amber)", "Plans events, edits workflows"],
    ["Player", "var(--color-accent)", "Does assigned tasks"],
    ["Everyone", "var(--color-text-muted)", "Everyone has it"],
  ];
  return (
    <Scene>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 8,
          alignItems: "start",
        }}
      >
        <Spot n={1} wide>
          <Panel title="Roles, highest first">
            {roles.map(([name, color, sub]) => (
              <Row key={name} glow={name === "Planner"}>
                <span
                  aria-hidden="true"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ⋮⋮
                </span>
                <span style={dot(color)} />
                <Text title={name} sub={sub} />
              </Row>
            ))}
          </Panel>
        </Spot>
        <Panel title="Planner can">
          <Row>
            <Spot n={2}>
              <span
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <Check on>Plan events and repeats</Check>
                <Check on>Edit workflows</Check>
                <Check on>Approve tasks</Check>
                <Check>Manage members</Check>
              </span>
            </Spot>
          </Row>
        </Panel>
      </span>
    </Scene>
  );
}

export function WorkGroupsList() {
  const groups: [string, string, string, string][] = [
    ["Players", "var(--color-accent)", "5 members", "Lead: Laramie"],
    ["Marketing", "var(--palette-blue)", "3 members", "Lead: Gerrah"],
    ["Design", "var(--palette-amber)", "2 members", "No lead yet"],
  ];
  return (
    <Scene>
      <Panel title="Work groups">
        {groups.map(([name, color, count, lead]) => (
          <Row key={name}>
            <span style={dot(color)} />
            <Text title={name} sub={lead} />
            <Small>{count}</Small>
          </Row>
        ))}
      </Panel>
      <span style={wrap}>
        <FakeButton>+ New group</FakeButton>
      </span>
    </Scene>
  );
}

export function GeneralSettings() {
  return (
    <Scene>
      <Panel title="Time and dates">
        <Row>
          <Spot n={1}>
            <Text title="Workspace time zone" sub="Toronto (Eastern)" />
          </Spot>
        </Row>
        <Row>
          <Spot n={2}>
            <span style={{ ...wrap, gap: 8 }}>
              <Field>Week starts on Monday</Field>
              <Field>Nov 12, 2026</Field>
              <Field>8:00 PM</Field>
            </span>
          </Spot>
        </Row>
      </Panel>
      <Panel title="Look">
        <Row>
          <Spot n={3}>
            <Segments items={["Light", "Dark", "Match device"]} on={2} />
          </Spot>
        </Row>
      </Panel>
    </Scene>
  );
}

export function PlatformUpdates() {
  return (
    <Scene>
      <Panel title="Platform updates">
        <Row>
          <Text
            title="Bring upcoming events' tasks in line with their workflows"
            sub="Nov 11 · 34 tasks in 9 events"
          />
          <Chip tone="accent">Applied</Chip>
        </Row>
        <Row>
          <span style={wrap}>
            <FakeButton>Check</FakeButton>
            <FakeButton primary>Apply now</FakeButton>
          </span>
        </Row>
      </Panel>
    </Scene>
  );
}

export function Maintenance() {
  return (
    <Scene>
      <Panel title="Database maintenance">
        <Row>
          <Switch />
          <Text
            title="Apply the fixes"
            sub="Off: each run only reports what it would fix."
          />
        </Row>
        <Row>
          <Text
            title="Found 3 things in the database and 2 unused files"
            sub="Sun 4 AM · Weekly · Report only"
          />
        </Row>
        <Row>
          <FakeButton>Run now</FakeButton>
        </Row>
      </Panel>
    </Scene>
  );
}

export function AccountPage() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Spot n={1}>
            <span style={wrap}>
              <Face initials="GE" />
              <FakeButton>Change photo</FakeButton>
            </span>
          </Spot>
        </Row>
        <Row>
          <Spot n={2}>
            <span style={{ ...wrap, gap: 8 }}>
              <Field>Name: Gerrah</Field>
              <Field>In-game name: Gerrah</Field>
            </span>
          </Spot>
        </Row>
        <Row>
          <Spot n={3}>
            <span style={{ ...wrap, gap: 8 }}>
              <Field>Time zone: London</Field>
              <Field>Date format</Field>
              <Field>Clock: 12-hour</Field>
            </span>
          </Spot>
        </Row>
        <Row>
          <Spot n={4}>
            <span style={wrap}>
              <FakeButton>Notifications</FakeButton>
              <FakeButton>Email me a reset link</FakeButton>
            </span>
          </Spot>
        </Row>
      </Panel>
    </Scene>
  );
}
