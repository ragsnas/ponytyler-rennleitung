export type BikeId = "1" | "2";

/** "3" means both bikes finished at the same time. */
export type Winner = BikeId | "3";

export type BikeStatusMessage = {
  pulsecount: number;
  sequenz: number;
  timestamp: number;
};

/** Runs `callback` after `delayMs`; returns a function that cancels it. */
export type Scheduler = (callback: () => void, delayMs: number) => () => void;

export interface BikeRaceTrackerOptions {
  onWinner: (winner: Winner) => void;
  /** Injectable clock; defaults to setTimeout/clearTimeout. */
  schedule?: Scheduler;
  /** How long after the first finisher to wait for the other bike before deciding. */
  analysisDelayMs?: number;
  log?: (message: string) => void;
}

/** A bike counts as having crossed the finish line once its pulsecount exceeds this. */
export const FINISH_PULSECOUNT_THRESHOLD = 120;
export const DEFAULT_ANALYSIS_DELAY_MS = 1000;

const defaultScheduler: Scheduler = (callback, delayMs) => {
  const timer = setTimeout(callback, delayMs);
  return () => clearTimeout(timer);
};

/**
 * Decides who won a race from the bikes' status messages. It holds the state
 * of ONE race at a time: call {@link reset} when the next race is about to
 * start, otherwise the finish flags of the previous race would suppress every
 * later winner.
 */
export class BikeRaceTracker {
  private readonly finishedAtSequenz = new Map<BikeId, number>();
  private cancelPendingAnalysis: (() => void) | undefined;

  private readonly schedule: Scheduler;
  private readonly analysisDelayMs: number;

  constructor(private readonly options: BikeRaceTrackerOptions) {
    this.schedule = options.schedule ?? defaultScheduler;
    this.analysisDelayMs = options.analysisDelayMs ?? DEFAULT_ANALYSIS_DELAY_MS;
  }

  handleStatus(bikeId: BikeId, status: BikeStatusMessage): void {
    if (status.pulsecount <= FINISH_PULSECOUNT_THRESHOLD) {
      return;
    }
    if (this.finishedAtSequenz.has(bikeId)) {
      return;
    }

    this.options.log?.(`🏁 Bike ${bikeId} finished: ${JSON.stringify(status)}`);
    const otherBikeAlreadyFinished = this.finishedAtSequenz.has(
      this.theOtherBike(bikeId),
    );
    this.finishedAtSequenz.set(bikeId, status.sequenz);

    // The first finisher starts the grace period in which the other bike may
    // still cross the line; the decision is made once, when it elapses.
    if (!otherBikeAlreadyFinished) {
      this.cancelPendingAnalysis = this.schedule(() => {
        this.cancelPendingAnalysis = undefined;
        this.options.onWinner(this.decideWinner());
      }, this.analysisDelayMs);
    }
  }

  /** Forgets the current race and drops any decision that has not been made yet. */
  reset(): void {
    this.cancelPendingAnalysis?.();
    this.cancelPendingAnalysis = undefined;
    this.finishedAtSequenz.clear();
  }

  private decideWinner(): Winner {
    const bike1 = this.finishedAtSequenz.get("1");
    const bike2 = this.finishedAtSequenz.get("2");
    if (bike1 !== undefined && bike2 === undefined) {
      return "1";
    }
    if (bike1 === undefined && bike2 !== undefined) {
      return "2";
    }
    if (bike1 !== undefined && bike2 !== undefined) {
      if (bike1 < bike2) {
        return "1";
      }
      if (bike1 > bike2) {
        return "2";
      }
    }
    return "3";
  }

  private theOtherBike(bikeId: BikeId): BikeId {
    return bikeId === "1" ? "2" : "1";
  }
}
