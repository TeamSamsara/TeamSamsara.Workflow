// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/peoplePictures.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Pictures for people and availability: painting your usual week,
// an exception, a personal appointment, Team availability, people tags, a
// group's page and a member's profile.

import type { CSSProperties } from "react";
import {
  Check,
  Chip,
  Face,
  FakeButton,
  Heading,
  Panel,
  Row,
  Scene,
  Segments,
  Small,
  Spot,
  Tabs,
  Text,
} from "./kit";

const hours = ["6", "7", "8", "9", "10", "11"];
const cell = (state: "free" | "busy" | "none" | number): CSSProperties => ({
  height: 18,
  borderRadius: 4,
  background:
    state === "busy"
      ? "var(--color-text)"
      : state === "none"
        ? "var(--color-field-fill)"
        : state === "free"
          ? "var(--color-surface)"
          : `color-mix(in srgb, var(--color-accent) ${Math.round(state * 100)}%, var(--color-surface))`,
  border: "1px solid var(--color-border)",
});
const grid = (columns: number): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `52px repeat(${columns}, minmax(0, 1fr))`,
  gap: 3,
  alignItems: "center",
  fontSize: 11,
});

export function UsualWeek() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const busy = [
    [0, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0],
  ];
  return (
    <Scene>
      <Small>Shaded: usually not free (PM, your time)</Small>
      <span style={grid(6)}>
        <span />
        {hours.map((hour) => (
          <Small key={hour}>{hour}</Small>
        ))}
        {days.map((day, row) => (
          <span key={day} style={{ display: "contents" }}>
            <b style={{ fontSize: 11 }}>{day}</b>
            {busy[row].map((on, column) => (
              <span
                key={`${day}${column}`}
                style={cell(on ? "busy" : "free")}
              />
            ))}
          </span>
        ))}
      </span>
      <FakeButton primary>Save</FakeButton>
    </Scene>
  );
}

export function Exception() {
  return (
    <Scene>
      <Panel pop title="Add an exception">
        <Row>
          <Text title="Fri Nov 20 – Sun Nov 22" sub="LAN tournament" />
        </Row>
        <Row>
          <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Check round on>
              Whole days
            </Check>
            <Check round>Between two times</Check>
          </span>
        </Row>
        <Row>
          <Segments items={["Unavailable", "Available"]} on={0} />
        </Row>
      </Panel>
    </Scene>
  );
}

export function PersonalYours() {
  return (
    <Scene>
      <Panel>
        <Row>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <Text title="Dentist" sub="Wed 3:00 – 4:00 PM" />
        </Row>
        <Row>
          <Check on>Share with my group leads</Check>
        </Row>
      </Panel>
    </Scene>
  );
}

export function PersonalOthers() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Text title="Busy" sub="Wed 3:00 – 4:00 PM" />
          <Chip tone="neutral">Gerrah</Chip>
        </Row>
      </Panel>
    </Scene>
  );
}

export function TeamAvailability() {
  const people: [string, number[]][] = [
    ["Okami", [1, 1, 1, 1, 0, 0]],
    ["Saltyvl", [0, 1, 1, 1, 1, 0]],
    ["Neversaw", [1, 1, 1, 0, 0, 1]],
  ];
  return (
    <Scene>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Heading>Players</Heading>
        <span style={{ marginLeft: "auto" }}>
          <Spot n={3}>
            <Segments items={["Team's time", "Mine"]} on={0} />
          </Spot>
        </span>
      </span>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "110px minmax(0, 1fr)",
          gap: 10,
        }}
      >
        <Panel>
          <Row>
            <Spot n={1}>
              <Check on>Starter</Check>
            </Spot>
          </Row>
          {people.map(([name]) => (
            <Row key={name}>
              <Check on>{name}</Check>
            </Row>
          ))}
          <Row>
            <Check>Coach</Check>
          </Row>
        </Panel>
        <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Spot n={2}>
            <span
              style={{
                ...grid(6),
                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                width: "100%",
              }}
            >
              {hours.map((hour) => (
                <Small key={hour}>{hour} PM</Small>
              ))}
              {[2 / 3, 1, 1, 2 / 3, 1 / 3, 1 / 3].map((share, index) => (
                <span key={index} style={{ ...cell(share), height: 34 }} />
              ))}
            </span>
          </Spot>
          <Small>Bright: all three free. 7 and 8 PM work.</Small>
        </span>
      </span>
    </Scene>
  );
}

export function TagsSettings() {
  const tags: [string, string][] = [
    ["Starter", "var(--palette-blue)"],
    ["Sub", "var(--palette-amber)"],
    ["Coach", "var(--color-accent)"],
  ];
  return (
    <Scene>
      <Panel title="People tags">
        {tags.map(([name, color]) => (
          <Row key={name}>
            <span
              aria-hidden="true"
              style={{ color: "var(--color-text-muted)" }}
            >
              ⋮⋮
            </span>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: color,
              }}
            />
            <Text title={name} />
            <Small>Rename · Delete</Small>
          </Row>
        ))}
      </Panel>
      <FakeButton>+ Add a tag</FakeButton>
    </Scene>
  );
}

export function TagsOnPerson() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Face initials="OK" />
          <Text title="Okami" sub="Players" />
        </Row>
        <Row>
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Chip tone="accent">✓ Starter</Chip>
            <Chip tone="outline">Sub</Chip>
            <Chip tone="outline">Coach</Chip>
          </span>
        </Row>
      </Panel>
      <Small>Click a tag to put it on or take it off.</Small>
    </Scene>
  );
}

export function GroupPage() {
  return (
    <Scene>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: "var(--palette-blue)",
          }}
        />
        <Heading>Marketing</Heading>
      </span>
      <Spot n={1}>
        <Tabs items={["Overview", "Calendar", "Availability"]} on={0} />
      </Spot>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 8,
        }}
      >
        <Panel title="Members">
          <Row>
            <Face initials="GE" />
            <Spot n={2}>
              <Text title="Gerrah" />
            </Spot>
            <Chip tone="neutral">Lead</Chip>
          </Row>
          <Row>
            <Face initials="LA" />
            <Text title="Laramie" />
          </Row>
        </Panel>
        <Panel title="Open tasks">
          <Row>
            <Spot n={3}>
              <Text title="Prep twitter caption" sub="Wed 12 PM" />
            </Spot>
          </Row>
          <Row>
            <Text title="Publish discord post" sub="Thu 7 PM" />
          </Row>
        </Panel>
      </span>
    </Scene>
  );
}

export function Profile() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Face initials="OK" />
          <Text title="Okami" sub="Players · Starter" />
          <Spot n={1}>
            <Chip tone="neutral">7:12 PM for them</Chip>
          </Spot>
        </Row>
        <Row>
          <Spot n={2}>
            <Small>Usual week · in their time or yours</Small>
          </Spot>
        </Row>
        <Row>
          <Spot n={3}>
            <span style={{ display: "flex", gap: 4 }}>
              <Chip tone="accent">✓ Starter</Chip>
              <Chip tone="outline">Sub</Chip>
            </span>
          </Spot>
        </Row>
      </Panel>
    </Scene>
  );
}
