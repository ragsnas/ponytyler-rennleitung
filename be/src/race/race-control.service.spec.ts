import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { RaceState, ShowState } from "@prisma/client";
import { RaceControlService } from "./race-control.service";

describe("RaceControlService", () => {
  const NOW = new Date("2026-11-17T20:00:00.000Z");
  let events: string[];
  let tx: { race: { findUnique: jest.Mock } };
  let prisma: { $transaction: jest.Mock };
  let raceService: {
    lockShow: jest.Mock;
    setStateInTransaction: jest.Mock;
    publishChanges: jest.Mock;
  };
  let showService: {
    updateShowInTransaction: jest.Mock;
    publishChanges: jest.Mock;
  };
  let service: RaceControlService;

  const storedRace = (raceState: RaceState) => ({
    id: 42,
    showId: 7,
    raceState,
  });
  const raceChanges = { updatedRace: { id: 42, raceState: RaceState.RACING } };
  const showChanges = { updatedShow: { id: 7, showState: ShowState.RACE } };

  beforeEach(() => {
    events = [];
    tx = { race: { findUnique: jest.fn() } };
    prisma = {
      $transaction: jest.fn(async (work: (t: unknown) => unknown) => {
        events.push("begin");
        const result = await work(tx);
        events.push("commit");
        return result;
      }),
    };
    raceService = {
      lockShow: jest.fn(async () => {
        events.push("lock");
      }),
      setStateInTransaction: jest.fn(async () => {
        events.push("race update");
        return raceChanges;
      }),
      publishChanges: jest.fn(() => events.push("publish race")),
    };
    showService = {
      updateShowInTransaction: jest.fn(async () => {
        events.push("show update");
        return showChanges;
      }),
      publishChanges: jest.fn(() => events.push("publish show")),
    };
    service = new RaceControlService(
      prisma as never,
      raceService as never,
      showService as never,
    );
  });

  it("moves the race and its show in ONE transaction, after locking the show, and returns both from the database", async () => {
    tx.race.findUnique.mockResolvedValue(storedRace(RaceState.WAITING_TO_RACE));

    const result = await service.transition(42, "start", NOW);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(raceService.lockShow).toHaveBeenCalledWith(tx, 7);
    expect(raceService.setStateInTransaction).toHaveBeenCalledWith(
      tx,
      storedRace(RaceState.WAITING_TO_RACE),
      { raceState: RaceState.RACING, raceStartedAt: NOW },
    );
    expect(showService.updateShowInTransaction).toHaveBeenCalledWith(
      tx,
      { id: 7 },
      { showState: ShowState.RACE },
    );
    expect(result).toEqual({
      race: raceChanges.updatedRace,
      show: showChanges.updatedShow,
    });
  });

  it("judges the race as it is once the lock is held, not as it was before", async () => {
    tx.race.findUnique
      .mockResolvedValueOnce(storedRace(RaceState.WAITING_TO_RACE))
      .mockResolvedValueOnce(storedRace(RaceState.LISTED)); // stop won the race

    await expect(service.transition(42, "start", NOW)).rejects.toThrow(
      ConflictException,
    );

    expect(raceService.setStateInTransaction).not.toHaveBeenCalled();
  });

  it("announces the changes only after the transaction has committed", async () => {
    tx.race.findUnique.mockResolvedValue(storedRace(RaceState.LISTED));

    await service.transition(42, "countdown", NOW);

    expect(events).toEqual([
      "begin",
      "lock",
      "race update",
      "show update",
      "commit",
      "publish race",
      "publish show",
    ]);
    expect(raceService.publishChanges).toHaveBeenCalledWith(raceChanges);
    expect(showService.publishChanges).toHaveBeenCalledWith(showChanges);
  });

  it("announces nothing and leaves the race alone when the show update fails", async () => {
    tx.race.findUnique.mockResolvedValue(storedRace(RaceState.LISTED));
    showService.updateShowInTransaction.mockRejectedValue(new Error("boom"));

    await expect(service.transition(42, "countdown", NOW)).rejects.toThrow(
      "boom",
    );

    expect(raceService.publishChanges).not.toHaveBeenCalled();
    expect(showService.publishChanges).not.toHaveBeenCalled();
    expect(events).not.toContain("commit");
  });

  it("answers 409 and changes nothing when the action does not fit the race state", async () => {
    tx.race.findUnique.mockResolvedValue(storedRace(RaceState.LISTED));

    await expect(service.transition(42, "stop", NOW)).rejects.toThrow(
      new ConflictException('Cannot "stop" a race that is LISTED'),
    );

    expect(raceService.setStateInTransaction).not.toHaveBeenCalled();
    expect(showService.updateShowInTransaction).not.toHaveBeenCalled();
    expect(raceService.publishChanges).not.toHaveBeenCalled();
  });

  it("answers 404 for a race that does not exist", async () => {
    tx.race.findUnique.mockResolvedValue(null);

    await expect(service.transition(42, "start", NOW)).rejects.toThrow(
      NotFoundException,
    );

    expect(raceService.lockShow).not.toHaveBeenCalled();
  });

  it("answers 400 for an unknown action without touching the database", async () => {
    await expect(service.transition(42, "explode", NOW)).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
