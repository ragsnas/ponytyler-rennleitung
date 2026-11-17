import { RaceState, ShowState } from "@prisma/client";
import { RACE_ACTIONS, isRaceAction, planTransition } from "./race-transitions";

const NOW = new Date("2026-11-17T20:00:00.000Z");
const ALL_RACE_STATES = Object.values(RaceState);

describe("planTransition", () => {
  it.each([
    ["countdown", RaceState.LISTED, RaceState.WAITING_TO_RACE, ShowState.RACE],
    ["start", RaceState.WAITING_TO_RACE, RaceState.RACING, ShowState.RACE],
    ["finish", RaceState.RACING, RaceState.RACED, ShowState.RACE_FINISHED],
    ["stop", RaceState.RACING, RaceState.LISTED, ShowState.BEFORE_RACE],
    [
      "stop",
      RaceState.WAITING_TO_RACE,
      RaceState.LISTED,
      ShowState.BEFORE_RACE,
    ],
    ["skip", RaceState.LISTED, RaceState.CANCELED, ShowState.BEFORE_RACE],
    ["lyrics", RaceState.RACED, RaceState.DONE, ShowState.BEFORE_RACE],
    [
      "video-done",
      RaceState.VIDEO_PLAYING,
      RaceState.DONE,
      ShowState.BEFORE_RACE,
    ],
  ] as const)(
    "%s moves a %s race to %s and the show to %s",
    (action, from, raceState, showState) => {
      const plan = planTransition(action, from, NOW);

      expect(plan).toEqual({
        ok: true,
        race: expect.objectContaining({ raceState }),
        showState,
      });
    },
  );

  it("stamps the start of the race when it starts, and nothing else", () => {
    expect(planTransition("start", RaceState.WAITING_TO_RACE, NOW)).toEqual({
      ok: true,
      race: { raceState: RaceState.RACING, raceStartedAt: NOW },
      showState: ShowState.RACE,
    });
  });

  it("stamps the end of the race when it finishes", () => {
    expect(planTransition("finish", RaceState.RACING, NOW)).toEqual({
      ok: true,
      race: { raceState: RaceState.RACED, raceFinishedAt: NOW },
      showState: ShowState.RACE_FINISHED,
    });
  });

  it("does not start a countdown for a race that is already waiting or racing", () => {
    for (const running of [RaceState.WAITING_TO_RACE, RaceState.RACING]) {
      expect(planTransition("countdown", running, NOW)).toMatchObject({
        ok: false,
        reason: "not-allowed",
      });
    }
  });

  it("does not race an incomplete race", () => {
    expect(
      planTransition("countdown", RaceState.WAITING_FOR_OPPONENT, NOW),
    ).toMatchObject({ ok: false, reason: "not-allowed" });
  });

  it("only starts a race whose countdown is running (e.g. not after stop was pressed meanwhile)", () => {
    for (const state of ALL_RACE_STATES.filter(
      (s) => s !== RaceState.WAITING_TO_RACE,
    )) {
      expect(planTransition("start", state, NOW)).toMatchObject({
        ok: false,
        reason: "not-allowed",
      });
    }
  });

  it("only stops a race that is in progress", () => {
    for (const state of ALL_RACE_STATES.filter(
      (s) => s !== RaceState.WAITING_TO_RACE && s !== RaceState.RACING,
    )) {
      expect(planTransition("stop", state, NOW)).toMatchObject({
        ok: false,
        reason: "not-allowed",
      });
    }
  });

  it("does not skip a race that is over, canceled or incomplete", () => {
    for (const state of [
      RaceState.DONE,
      RaceState.CANCELED,
      RaceState.WAITING_FOR_OPPONENT,
    ]) {
      expect(planTransition("skip", state, NOW)).toMatchObject({
        ok: false,
        reason: "not-allowed",
      });
    }
  });

  it("only sets a race to DONE once it was raced", () => {
    expect(planTransition("lyrics", RaceState.LISTED, NOW)).toMatchObject({
      ok: false,
      reason: "not-allowed",
    });
    expect(planTransition("video-done", RaceState.LISTED, NOW)).toMatchObject({
      ok: false,
      reason: "not-allowed",
    });
  });

  it("names the action and the state in the refusal", () => {
    const plan = planTransition("stop", RaceState.LISTED, NOW);

    expect(plan).toEqual({
      ok: false,
      reason: "not-allowed",
      message: 'Cannot "stop" a race that is LISTED',
    });
  });

  it("rejects an unknown action", () => {
    expect(planTransition("explode", RaceState.LISTED, NOW)).toEqual({
      ok: false,
      reason: "unknown-action",
      message: 'Unknown race action "explode"',
    });
  });

  it("does not mistake object prototype keys for actions", () => {
    expect(planTransition("constructor", RaceState.LISTED, NOW)).toMatchObject({
      ok: false,
      reason: "unknown-action",
    });
  });
});

describe("isRaceAction", () => {
  it("knows every action of the table and nothing else", () => {
    expect([...RACE_ACTIONS].sort()).toEqual([
      "countdown",
      "finish",
      "lyrics",
      "skip",
      "start",
      "stop",
      "video-done",
    ]);
    expect(isRaceAction("skip")).toBe(true);
    expect(isRaceAction("toString")).toBe(false);
    expect(isRaceAction(undefined)).toBe(false);
  });
});
