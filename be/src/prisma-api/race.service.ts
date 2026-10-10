import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { ShowService } from "./show.service";
import { Prisma, Race, RaceState } from "@prisma/client";
import mqtt from "mqtt";
import * as os from "os";

const DEFAULT_MQTT_PORT = 3001;
const RACE_STATE_CHANGE_TOPIC = "RaceStateChange";
/** First key of the advisory lock taken per show (see lockShow). */
const RACE_LOCK_NAMESPACE = 1;

@Injectable()
export class RaceService implements OnModuleDestroy {
  private readonly mqttClient: mqtt.MqttClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private showService: ShowService,
  ) {
    const port = Number(
      this.configService.get("MQTT_PORT") ?? DEFAULT_MQTT_PORT,
    );
    this.mqttClient = mqtt.connect(`mqtt://${os.hostname()}:${port}`, {
      clientId: "be-race-service",
    });
  }

  onModuleDestroy() {
    this.mqttClient.end();
  }

  async race(
    raceWhereUniqueInput: Prisma.RaceWhereUniqueInput,
  ): Promise<Race | null> {
    return this.prisma.race.findUnique({
      where: raceWhereUniqueInput,
    });
  }

  async raceWithSongs(raceId: string): Promise<Race | null> {
    return this.prisma.race.findUnique({
      where: { id: Number(raceId) },
      include: { song1: true, song2: true },
    });
  }

  async upcomingRaceWithSongs() {
    const show = await this.showService.getCurrentShow();
    return this.prisma.race.findFirst({
      where: {
        showId: Number(show.id),
        raceState: { equals: RaceState.LISTED },
      },
      include: { song1: true, song2: true },
      orderBy: { orderNumber: "asc" },
    });
  }

  async upcomingRacesWithSongs() {
    const show = await this.showService.getCurrentShow();
    return this.prisma.race.findMany({
      where: {
        showId: Number(show.id),
        raceState: { equals: RaceState.LISTED },
      },
      include: { song1: true, song2: true },
      orderBy: { orderNumber: "asc" },
    });
  }

  async races(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RaceWhereUniqueInput;
    where?: Prisma.RaceWhereInput;
    orderBy?: Prisma.RaceOrderByWithRelationInput;
  }): Promise<Race[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.race.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { song1: true, song2: true },
    });
  }

  async createRace(
    data: Omit<Prisma.RaceUncheckedCreateInput, "orderNumber"> & {
      /** Ignored: the next free number of the show is assigned here. */
      orderNumber?: number;
    },
  ): Promise<Race> {
    const showId = Number(data.showId);
    return this.prisma.$transaction(async (tx) => {
      // serialise with other creates/updates of this show so two races cannot
      // be given the same orderNumber ((showId, orderNumber) is unique)
      await this.lockShow(tx, showId);
      const { _max } = await tx.race.aggregate({
        where: { showId },
        _max: { orderNumber: true },
      });
      return tx.race.create({
        data: {
          raceState: this.calculateRaceState(data),
          person1: data.person1,
          song1Id: data.song1Id == null ? null : Number(data.song1Id),
          person2: data.person2,
          song2Id: data.song2Id == null ? null : Number(data.song2Id),
          showId,
          createdAt: data.createdAt || new Date(),
          orderNumber: (_max.orderNumber ?? -1) + 1,
        },
      });
    });
  }

  async updateRace(params: {
    where: Prisma.RaceWhereUniqueInput;
    data: Prisma.RaceUncheckedUpdateInput;
  }): Promise<Race> {
    const { where, data } = params;

    // Everything that decides which race is active happens in one transaction;
    // the MQTT events are only published once it has committed.
    const { existingRace, updatedRace, resetRaces } =
      await this.prisma.$transaction(async (tx) => {
        let existingRace = await tx.race.findUnique({ where });
        if (existingRace) {
          await this.lockShow(tx, existingRace.showId);
          // re-read under the lock: a concurrent update may just have committed
          existingRace = await tx.race.findUnique({ where });
        }
        const updatedRace = await tx.race.update({
          data: {
            person1: data.person1,
            song1: data.song1Id
              ? { connect: { id: Number(data.song1Id) } }
              : undefined,
            person2: data.person2,
            song2: data.song2Id
              ? { connect: { id: Number(data.song2Id) } }
              : undefined,
            createdAt: data.createdAt,
            orderNumber: data.orderNumber,
            raced: data.raced,
            raceStartedAt: data.raceStartedAt,
            raceFinishedAt: data.raceFinishedAt,
            raceState: this.calculateRaceState(data),
            bikeWon: data.bikeWon,
            show: {
              connect: {
                id: Number(data.showId),
              },
            },
          },
          where,
        });
        const resetRaces = this.isActiveRaceState(
          updatedRace.raceState as RaceState,
        )
          ? await this.resetOtherActiveRaces(tx, updatedRace)
          : [];
        return { existingRace, updatedRace, resetRaces };
      });

    if (existingRace && existingRace.raceState !== updatedRace.raceState) {
      console.log(`Race State Changed:`, updatedRace.raceState);
      this.publishRaceStateChange(updatedRace);
    }
    resetRaces.forEach((race) => this.publishRaceStateChange(race));

    return updatedRace;
  }

  /**
   * Takes a transaction-scoped advisory lock for the show, so two concurrent
   * updates (UI and MQTT winner detection) cannot both activate a race.
   * Released automatically on commit/rollback.
   */
  private async lockShow(tx: Prisma.TransactionClient, showId: number) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RACE_LOCK_NAMESPACE}::int, ${showId}::int)`;
  }

  private isActiveRaceState(raceState: RaceState): boolean {
    return !RaceService.ALLOWED_INACTIVE_RACE_STATES.includes(raceState);
  }

  /** Resets the other active races *of the same show*; returns the reset races. */
  private async resetOtherActiveRaces(
    tx: Prisma.TransactionClient,
    activeRace: Race,
  ): Promise<Race[]> {
    return tx.race.updateManyAndReturn({
      where: {
        showId: activeRace.showId,
        id: { not: activeRace.id },
        raceState: { notIn: RaceService.ALLOWED_INACTIVE_RACE_STATES },
      },
      data: { raceState: RaceState.LISTED },
    });
  }

  private static readonly ALLOWED_INACTIVE_RACE_STATES: RaceState[] = [
    RaceState.CANCELED,
    RaceState.LISTED,
    RaceState.DONE,
    RaceState.WAITING_FOR_OPPONENT,
  ];

  private publishRaceStateChange(race: Race) {
    this.mqttClient.publish(
      RACE_STATE_CHANGE_TOPIC,
      JSON.stringify({ raceId: race.id.toString(), state: race.raceState }),
    );
  }

  async repairOrder(showId: string) {
    console.log(`Repairing Order`);
    const allRaces: Race[] = await this.races({
      where: { showId: Number(showId) },
      orderBy: { orderNumber: "asc" },
    });
    console.log(`Found ${allRaces.length} races`);
    const transactions = [];
    for (const [indexCounter, race] of allRaces.entries()) {
      console.log(
        `> [${indexCounter}] Preparing update for order nr ${race.orderNumber} (race id: ${race.id})`,
      );
      transactions.push(
        this.prisma.race.update({
          data: {
            orderNumber: indexCounter,
          },
          where: { id: race.id },
        }),
      );
    }

    return this.prisma.$transaction(transactions);
  }

  async moveRacePosition(params: { raceToMoveId: string; upOrDown: string }) {
    const raceToMove: Race = await this.race({
      id: Number(params.raceToMoveId),
    });
    const orderNumberEqClause =
      params.upOrDown === "up"
        ? { lt: raceToMove.orderNumber }
        : { gt: raceToMove.orderNumber };
    const raceToSwitchWithResults: Race[] = await this.races({
      where: {
        showId: Number(raceToMove.showId),
        raceState: RaceState.LISTED,
        orderNumber: orderNumberEqClause,
      },
      orderBy: { orderNumber: params.upOrDown === "up" ? "desc" : "asc" },
      take: 1,
    });
    const raceToSwitchWith: Race = raceToSwitchWithResults[0];
    if (raceToSwitchWith) {
      console.log(
        `>>>>>\nraceToMove #${raceToMove.id}: ${raceToMove.orderNumber}` +
          `\nwill switch with:` +
          `\nraceToSwitchWith #${raceToSwitchWith.id}: ${raceToSwitchWith.orderNumber}` +
          `\n to move "${params.upOrDown}"`,
      );

      console.log(`raceToMove:`, raceToMove);
      console.log(`raceToSwitchWith:`, raceToSwitchWith);
      // (showId, orderNumber) is unique, so the two numbers cannot be swapped
      // directly: park the moved race on a temporary negative number (its own
      // id, which no real race uses) while the other one takes its place.
      const parkRaceToMove = this.prisma.race.update({
        data: { orderNumber: -raceToMove.id },
        where: { id: raceToMove.id },
      });
      const updateRaceToSwitchWith = this.prisma.race.update({
        data: { orderNumber: raceToMove.orderNumber },
        where: { id: raceToSwitchWith.id },
      });
      const updateRaceToMove = this.prisma.race.update({
        data: { orderNumber: raceToSwitchWith.orderNumber },
        where: { id: raceToMove.id },
      });

      return this.prisma.$transaction([
        parkRaceToMove,
        updateRaceToSwitchWith,
        updateRaceToMove,
      ]);
    }
  }

  private calculateRaceState(data: Prisma.RaceUncheckedUpdateInput): RaceState {
    if (
      data.raceState === RaceState.WAITING_FOR_OPPONENT &&
      data.song1Id &&
      data.song2Id &&
      data.person1 &&
      data.person2
    ) {
      return RaceState.LISTED;
    } else if (
      data.raceState === RaceState.LISTED &&
      !(data.song1Id && data.song2Id && data.person1 && data.person2)
    ) {
      return RaceState.WAITING_FOR_OPPONENT;
    }

    return (data.raceState as RaceState) || RaceState.LISTED;
  }

  async deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race> {
    return this.prisma.race.delete({
      where,
    });
  }

  async currentRace(showId: number) {
    console.log(`Loading current race for show ${showId}`);
    let currentRace: Race = await this.prisma.race.findFirst({
      where: {
        raceState: {
          in: [
            RaceState.WAITING_TO_RACE,
            RaceState.RACING,
            RaceState.ERROR,
            RaceState.RACED,
            RaceState.VIDEO_PLAYING,
          ],
        },
        showId: { equals: showId },
      },
      orderBy: { orderNumber: "desc" },
      include: { song1: true, song2: true },
    });
    if (!currentRace) {
      console.log(`No active Race found, loading latest added Race instead`);
      currentRace = await this.prisma.race.findFirst({
        where: {
          raceState: {
            equals: RaceState.LISTED,
          },
          showId: { equals: showId },
        },
        orderBy: { orderNumber: "desc" },
        include: { song1: true, song2: true },
      });
    }
    return currentRace;
  }
}
