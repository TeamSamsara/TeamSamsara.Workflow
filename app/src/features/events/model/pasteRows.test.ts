// File : /TeamSamsara.Workflow/app/src/features/events/model/pasteRows.test.ts
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : Tests reading pasted rows: splitting cells, dates and times
// written many ways, guessing the columns, and TBD left empty.

import { describe, expect, it } from "vitest";
import {
  gapColumn,
  guessColumns,
  readDate,
  readPasted,
  readTimes,
  splitTable,
} from "./pasteRows";

const options = { today: "2026-11-01", dayFirst: false };

describe("splitting", () => {
  it("splits on tabs from a spreadsheet", () => {
    expect(splitTable("Jan 9\t5 PM\tTeam Nova\n\nJan 16\t5 PM")).toEqual([
      ["Jan 9", "5 PM", "Team Nova"],
      ["Jan 16", "5 PM", ""],
    ]);
  });

  it("splits a CSV, keeping quoted commas", () => {
    expect(splitTable('"Sat, Jan 9",Nova\n"Sat, Jan 16","Fox, Polar"')).toEqual(
      [
        ["Sat, Jan 9", "Nova"],
        ["Sat, Jan 16", "Fox, Polar"],
      ],
    );
  });
});

describe("dates", () => {
  it("reads the usual ways of writing a date", () => {
    expect(readDate("2027-01-09", options)).toBe("2027-01-09");
    expect(readDate("Sat Jan 9 2027", options)).toBe("2027-01-09");
    expect(readDate("January 9th, 2027", options)).toBe("2027-01-09");
    expect(readDate("9 janv. 2027", options)).toBe("2027-01-09");
    expect(readDate("samedi 9 août 2027", options)).toBe("2027-08-09");
    expect(readDate("1/9/2027", options)).toBe("2027-01-09");
    expect(readDate("1/9/2027", { ...options, dayFirst: true })).toBe(
      "2027-09-01",
    );
    expect(readDate("25/12/2026", options)).toBe("2026-12-25");
  });

  it("puts the next year on dates written without one", () => {
    expect(readDate("Jan 9", options)).toBe("2027-01-09");
    expect(readDate("Nov 20", options)).toBe("2026-11-20");
    expect(readDate("Oct 15", options)).toBe("2026-10-15");
  });

  it("finds no date where there isn't one", () => {
    expect(readDate("Team Nova", options)).toBeNull();
    expect(readDate("Week 3", options)).toBeNull();
    expect(readDate("5:00 PM", options)).toBeNull();
    expect(readDate("Feb 30 2027", options)).toBeNull();
  });
});

describe("times", () => {
  it("reads 12 and 24 hour times", () => {
    expect(readTimes("5:00 PM")).toEqual(["17:00"]);
    expect(readTimes("5pm")).toEqual(["17:00"]);
    expect(readTimes("12:30 a.m.")).toEqual(["00:30"]);
    expect(readTimes("17:00")).toEqual(["17:00"]);
    expect(readTimes("17h30")).toEqual(["17:30"]);
  });

  it("reads ranges, sharing the AM/PM", () => {
    expect(readTimes("5 – 7 PM")).toEqual(["17:00", "19:00"]);
    expect(readTimes("17:00-19:30")).toEqual(["17:00", "19:30"]);
  });

  it("doesn't take dates or numbers for times", () => {
    expect(readTimes("Sat Jan 9 2027 5:00 PM")).toEqual(["17:00"]);
    expect(readTimes("Week 1")).toEqual([]);
    expect(readTimes("1/9/2027")).toEqual([]);
  });
});

describe("columns and rows", () => {
  const usual = { time: "19:00", endTime: "21:00" };

  it("guesses date, start and gaps, and leaves TBD empty", () => {
    const table = splitTable(
      "Sat Jan 9 2027\t5:00 PM\tTeam Nova\tWeek 1\nSat Jan 16 2027\t5:00 PM\tTBD\tWeek 2",
    );
    const guess = guessColumns(table, ["opponent", "round"], options);
    expect(guess).toEqual({
      kinds: ["date", "start", gapColumn("opponent"), gapColumn("round")],
      hasHeader: false,
    });
    const read = readPasted(table, guess, usual, options);
    expect(read.rows).toEqual([
      {
        date: "2027-01-09",
        time: "17:00",
        endTime: "19:00",
        values: { opponent: "Team Nova", round: "Week 1" },
      },
      {
        date: "2027-01-16",
        time: "17:00",
        endTime: "19:00",
        values: { round: "Week 2" },
      },
    ]);
    expect(read.unknown).toBe(1);
  });

  it("uses a header row to name the columns", () => {
    const table = splitTable(
      "Round,Opponent,Date,Start,End\nWeek 1,Nova,2027-01-09,17:00,18:30",
    );
    const guess = guessColumns(table, ["opponent", "round"], options);
    expect(guess.hasHeader).toBe(true);
    expect(guess.kinds).toEqual([
      gapColumn("round"),
      gapColumn("opponent"),
      "date",
      "start",
      "end",
    ]);
    expect(readPasted(table, guess, usual, options).rows[0]).toMatchObject({
      date: "2027-01-09",
      time: "17:00",
      endTime: "18:30",
    });
  });

  it("uses the usual times and skips lines without a date", () => {
    const table = splitTable("Jan 9\tNova\nsomeday\tFox");
    const guess = guessColumns(table, ["opponent"], options);
    const read = readPasted(table, guess, usual, options);
    expect(read.rows).toEqual([
      {
        date: "2027-01-09",
        time: "19:00",
        endTime: "21:00",
        values: { opponent: "Nova" },
      },
    ]);
    expect(read.skipped).toEqual([2]);
  });
});
