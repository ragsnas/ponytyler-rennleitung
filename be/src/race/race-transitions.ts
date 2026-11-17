import { RaceState, ShowState } from "@prisma/client";

/**
 * The operator's actions on the current race (the buttons of the state
 * machine page), as one table: which race states an action may be applied
 * to, where it moves the race and the show. Pure, so it is testable without
 * a database; RaceControlService applies it atomically.
 *
 * `lyrics` and `video-done` have the same effect today but are different
 * buttons with different preconditions, so they are different actions.
 */
export type RaceAction =
  "countdown" | "start" | "finish" | "stop" | "skip" | "lyrics" | "video-done";

interface Rule {
  /** Race states the action may be applied to. */
  from: RaceState[];
  raceState: RaceState;
  showState: ShowState;
  /** Timestamp column to set to "now". */
  stamp?: "raceStartedAt" | "raceFinishedAt";
}

const IN_PROGRESS = [RaceState.WAITING_TO_RACE, RaceState.RACING];
/** Races the operator can currently be looking at (see RaceService.currentRace). */
const CURRENT = [
  RaceState.LISTED,
  RaceState.WAITING_TO_RACE,
  RaceState.RACING,
  RaceState.RACED,
  RaceState.ERROR,
  RaceState.VIDEO_PLAYING,
];

const RULES: Record<RaceAction, Rule> = {
  countdown: {
    from: [
      RaceState.LISTED,
      RaceState.RACED,
      RaceState.ERROR,
      RaceState.VIDEO_PLAYING,
    ],
    raceState: RaceState.WAITING_TO_RACE,
    showState: ShowState.RACE,
  },
  start: {
    from: [RaceState.WAITING_TO_RACE],
    raceState: RaceState.RACING,
    showState: ShowState.RACE,
    stamp: "raceStartedAt",
  },
  finish: {
    from: [RaceState.RACING],
    raceState: RaceState.RACED,
    showState: ShowState.RACE_FINISHED,
    stamp: "raceFinishedAt",
  },
  stop: {
    from: IN_PROGRESS,
    raceState: RaceState.LISTED,
    showState: ShowState.BEFORE_RACE,
  },
  skip: {
    from: CURRENT,
    raceState: RaceState.CANCELED,
    showState: ShowState.BEFORE_RACE,
  },
  lyrics: {
    from: [RaceState.RACED],
    raceState: RaceState.DONE,
    showState: ShowState.BEFORE_RACE,
  },
  "video-done": {
    from: [RaceState.RACED, RaceState.VIDEO_PLAYING],
    raceState: RaceState.DONE,
    showState: ShowState.BEFORE_RACE,
  },
};

export const RACE_ACTIONS = Object.keys(RULES) as RaceAction[];

export function isRaceAction(value: unknown): value is RaceAction {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(RULES, value)
  );
}

export type TransitionPlan =
  | {
      ok: true;
      /** What to write to the race. */
      race: {
        raceState: RaceState;
        raceStartedAt?: Date;
        raceFinishedAt?: Date;
      };
      /** The state the show moves to together with the race. */
      showState: ShowState;
    }
  | { ok: false; reason: "unknown-action" | "not-allowed"; message: string };

export function planTransition(
  action: unknown,
  current: RaceState,
  now: Date,
): TransitionPlan {
  if (!isRaceAction(action)) {
    return {
      ok: false,
      reason: "unknown-action",
      message: `Unknown race action "${String(action)}"`,
    };
  }
  const rule = RULES[action];
  if (!rule.from.includes(current)) {
    return {
      ok: false,
      reason: "not-allowed",
      message: `Cannot "${action}" a race that is ${current}`,
    };
  }
  return {
    ok: true,
    race: {
      raceState: rule.raceState,
      ...(rule.stamp ? { [rule.stamp]: now } : {}),
    },
    showState: rule.showState,
  };
}
