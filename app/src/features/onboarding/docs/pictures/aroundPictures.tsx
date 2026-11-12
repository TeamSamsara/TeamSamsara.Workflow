// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/pictures/aroundPictures.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : Pictures for getting around: the calendar and its controls, an
// event's page, replying, how replies show on the calendar, times in your own
// zone, and the notifications list.

import type { CSSProperties, ReactNode } from "react";
import {
  Chip,
  Face,
  Field,
  Heading,
  Panel,
  Row,
  Scene,
  Segments,
  Small,
  Spot,
  Strike,
  Switch,
  Text,
} from "./kit";

const line: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

/** An event as the calendar draws it, with its done badge. */
function Block({
  title,
  time,
  badge,
  mine,
  children,
}: {
  title: ReactNode;
  time: string;
  badge?: ReactNode;
  mine?: boolean;
  children?: ReactNode;
}) {
  return (
    <span
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
        padding: "5px 7px",
        borderRadius: 6,
        fontSize: 11,
        background: "var(--color-surface)",
        border: mine
          ? "1.5px solid var(--color-text)"
          : "1px solid var(--color-border)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {children}
        <b style={{ flexGrow: 1, minWidth: 0 }}>{title}</b>
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: "var(--color-text-muted)",
        }}
      >
        <span style={{ flexGrow: 1 }}>{time}</span>
        {badge}
      </span>
    </span>
  );
}

export function CalendarControls() {
  const days = ["Tue 10", "Wed 11", "Thu 12"];
  return (
    <Scene>
      <span style={line}>
        <Spot n={1}>
          <Field>Calendar: My calendar ▾</Field>
        </Spot>
        <Spot n={2}>
          <span style={{ ...line, fontSize: 12 }}>
            <Switch />
            Show tasks
          </span>
        </Spot>
        <span style={{ marginLeft: "auto" }}>
          <Spot n={3}>
            <Segments items={["Month", "Week", "List"]} on={1} />
          </Spot>
        </span>
      </span>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 6,
          alignItems: "start",
        }}
      >
        {days.map((day) => (
          <Small key={day}>{day}</Small>
        ))}
        <Block title="Scrim" time="7 PM" />
        <Block title="Review" time="6 PM" />
        <Spot n={4} wide>
          <Block
            mine
            title="Match"
            time="8 PM"
            badge={<Chip tone="neutral">3/10</Chip>}
          />
        </Spot>
      </span>
    </Scene>
  );
}

export function EventPage() {
  return (
    <Scene>
      <Small>Planning / NA Rise Fall Split</Small>
      <Heading>vs. Nine Lives Esports</Heading>
      <Small>Thu Nov 12 · 8:00 – 10:00 PM · Match</Small>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 8,
          alignItems: "start",
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Panel title="Who's in it">
            <Row>
              <Spot n={1}>
                <span style={line}>
                  <Chip tone="info">Players</Chip>
                  <Chip tone="info">Marketing</Chip>
                  <Face initials="GE" />
                </span>
              </Spot>
            </Row>
          </Panel>
          <Panel title="Details">
            <Row>
              <Spot n={2}>
                <Text title="Opponent" sub="Nine Lives Esports" />
              </Spot>
            </Row>
          </Panel>
        </span>
        <Panel title="Tasks · 3 of 10 done">
          <Row>
            <Spot n={3}>
              <Text title="Prep twitter caption" sub="Done" />
            </Spot>
          </Row>
          <Row>
            <Text title="Publish discord post" sub="Thu 7 PM · Marketing" />
          </Row>
          <Row>
            <Text title="Post the result" sub="Thu 10 PM · Gerrah" />
          </Row>
        </Panel>
      </span>
    </Scene>
  );
}

export function ReplyBox() {
  return (
    <Scene>
      <Panel pop title="Are you going?">
        <Row>
          <Spot n={1}>
            <Segments items={["Going", "Maybe", "Can't go"]} on={1} />
          </Spot>
          <Chip tone="warn">Required</Chip>
        </Row>
        <Row>
          <Spot n={2}>
            <Field>15 min late, finishing work</Field>
          </Spot>
        </Row>
      </Panel>
      <Spot n={3}>
        <span style={line}>
          <Chip tone="accent">6 going</Chip>
          <Chip tone="warn">1 maybe</Chip>
          <Chip tone="alert">1 can't go</Chip>
          <Chip tone="outline">2 waiting</Chip>
        </span>
      </Spot>
    </Scene>
  );
}

export function ReplyMarks() {
  const marks: [ReactNode, ReactNode, string][] = [
    ["✓", "Scrim", "You're going"],
    ["?", "Review", "Maybe"],
    [
      <span
        key="dot"
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "var(--color-accent)",
          outline: "1px solid var(--color-text)",
        }}
      />,
      "Practice",
      "Waiting on you",
    ],
    ["", <Strike key="s">Showmatch</Strike>, "You can't go"],
  ];
  return (
    <Scene>
      <span
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr)",
          gap: 8,
          alignItems: "center",
        }}
      >
        {marks.map(([mark, title, meaning]) => (
          <span key={meaning} style={{ display: "contents" }}>
            <Block title={title} time="7 PM">
              {mark ? (
                <span
                  style={{
                    width: 12,
                    display: "inline-flex",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {mark}
                </span>
              ) : null}
            </Block>
            <Small>{meaning}</Small>
          </span>
        ))}
      </span>
    </Scene>
  );
}

export function TimesOnForm() {
  return (
    <Scene>
      <Panel pop title="New event">
        <Row>
          <Field>Thu Nov 12</Field>
          <Field>8:00 PM</Field>
        </Row>
        <Row>
          <Small>Times here are in Toronto time.</Small>
        </Row>
      </Panel>
    </Scene>
  );
}

export function TimesOnEvent() {
  return (
    <Scene>
      <Panel>
        <Row>
          <Text
            title="Fri Nov 13 · 1:00 AM your time"
            sub="Thu Nov 12 · 8:00 PM Toronto time"
          />
        </Row>
      </Panel>
    </Scene>
  );
}

export function NotificationList() {
  return (
    <Scene>
      <span style={line}>
        <Heading>Notifications</Heading>
        <span style={{ marginLeft: "auto" }}>
          <Spot n={1}>
            <Segments items={["All", "Unread"]} on={0} />
          </Spot>
        </span>
      </span>
      <Panel>
        <Row glow>
          <Face initials="LA" />
          <Spot n={2}>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text
                title="Laramie asks if you're going to Scrim"
                sub="Tue 7 PM"
              />
              <Segments items={["Going", "Maybe", "Can't go"]} on={-1} />
            </span>
          </Spot>
        </Row>
        <Row glow>
          <Face initials="GE" />
          <Spot n={3}>
            <Text
              title="Gerrah planned NA Rise Fall Split"
              sub="6 tasks are yours, 12 your groups' · Show the tasks"
            />
          </Spot>
        </Row>
        <Row>
          <Face initials="PB" />
          <Text title="Post the result is due in 1 hour" sub="Reminder" />
        </Row>
      </Panel>
    </Scene>
  );
}
