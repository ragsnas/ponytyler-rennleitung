import {
  BikeRaceTracker,
  BikeStatusMessage,
  Scheduler,
  Winner,
} from "./bike-race-tracker";

/** Manual clock: scheduled callbacks only run when the test advances time. */
class ManualScheduler {
  private now = 0;
  private nextId = 0;
  private readonly pending = new Map<
    number,
    { at: number; callback: () => void }
  >();

  readonly schedule: Scheduler = (callback, delayMs) => {
    const id = this.nextId++;
    this.pending.set(id, { at: this.now + delayMs, callback });
    return () => {
      this.pending.delete(id);
    };
  };

  advance(ms: number) {
    this.now += ms;
    for (const [id, task] of [...this.pending]) {
      if (task.at <= this.now) {
        this.pending.delete(id);
        task.callback();
      }
    }
  }

  get pendingCount() {
    return this.pending.size;
  }
}

const status = (pulsecount: number, sequenz: number): BikeStatusMessage => ({
  pulsecount,
  sequenz,
  timestamp: sequenz * 10,
});

describe("BikeRaceTracker", () => {
  let clock: ManualScheduler;
  let winners: Winner[];
  let tracker: BikeRaceTracker;

  beforeEach(() => {
    clock = new ManualScheduler();
    winners = [];
    tracker = new BikeRaceTracker({
      onWinner: (winner) => winners.push(winner),
      schedule: clock.schedule,
    });
  });

  it("ignores status messages that have not passed the finish threshold", () => {
    tracker.handleStatus("1", status(50, 1));
    tracker.handleStatus("2", status(120, 2));
    clock.advance(5000);

    expect(winners).toEqual([]);
    expect(clock.pendingCount).toBe(0);
  });

  it("declares bike 1 the winner when it finishes alone", () => {
    tracker.handleStatus("1", status(121, 10));

    expect(winners).toEqual([]); // analysed only after the grace period
    clock.advance(1000);

    expect(winners).toEqual(["1"]);
  });

  it("declares bike 2 the winner when it finishes alone", () => {
    tracker.handleStatus("2", status(121, 10));
    clock.advance(1000);

    expect(winners).toEqual(["2"]);
  });

  it("gives the win to the bike that was observed finishing at the lower sequence number", () => {
    tracker.handleStatus("2", status(121, 12));
    tracker.handleStatus("1", status(121, 10));
    clock.advance(1000);

    expect(winners).toEqual(["1"]);
  });

  it("lets bike 2 win when it finishes at the lower sequence number, even if reported later", () => {
    tracker.handleStatus("1", status(121, 14));
    tracker.handleStatus("2", status(121, 11));
    clock.advance(1000);

    expect(winners).toEqual(["2"]);
  });

  it("declares a tie (3) when both bikes finish at the same sequence number", () => {
    tracker.handleStatus("1", status(121, 10));
    tracker.handleStatus("2", status(121, 10));
    clock.advance(1000);

    expect(winners).toEqual(["3"]);
  });

  it("analyses only once per race, however many finish messages arrive", () => {
    tracker.handleStatus("1", status(121, 10));
    tracker.handleStatus("1", status(125, 11));
    tracker.handleStatus("2", status(122, 12));
    tracker.handleStatus("2", status(130, 13));
    clock.advance(5000);

    expect(winners).toEqual(["1"]);
  });

  describe("consecutive races", () => {
    it("does not detect a second winner without a reset (the bug this guards against)", () => {
      tracker.handleStatus("1", status(121, 10));
      clock.advance(1000);
      tracker.handleStatus("2", status(121, 3));
      clock.advance(1000);

      expect(winners).toEqual(["1"]);
    });

    it("detects the winner of the next race after a reset", () => {
      tracker.handleStatus("1", status(121, 10));
      clock.advance(1000);

      tracker.reset();
      tracker.handleStatus("2", status(121, 3));
      clock.advance(1000);

      expect(winners).toEqual(["1", "2"]);
    });

    it("detects a tie in the second race after a reset", () => {
      tracker.handleStatus("2", status(121, 10));
      clock.advance(1000);

      tracker.reset();
      tracker.handleStatus("1", status(121, 4));
      tracker.handleStatus("2", status(121, 4));
      clock.advance(1000);

      expect(winners).toEqual(["2", "3"]);
    });

    it("does not carry the finish sequence of the previous race into the next one", () => {
      tracker.handleStatus("1", status(121, 5));
      tracker.handleStatus("2", status(121, 6));
      clock.advance(1000);

      tracker.reset();
      tracker.handleStatus("2", status(121, 100));
      tracker.handleStatus("1", status(121, 101));
      clock.advance(1000);

      expect(winners).toEqual(["1", "2"]);
    });
  });

  describe("reset", () => {
    it("cancels a pending analysis so a stale result is never reported", () => {
      tracker.handleStatus("1", status(121, 10));

      tracker.reset();
      clock.advance(5000);

      expect(winners).toEqual([]);
      expect(clock.pendingCount).toBe(0);
    });

    it("can be called repeatedly and before any race", () => {
      tracker.reset();
      tracker.reset();
      tracker.handleStatus("1", status(121, 10));
      clock.advance(1000);

      expect(winners).toEqual(["1"]);
    });
  });
});
