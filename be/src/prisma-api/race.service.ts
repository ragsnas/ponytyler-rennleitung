import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { Prisma, Race } from "@prisma/client";
import { RaceState } from "../race/race-state.enum";
import mqtt from "mqtt";
import * as os from "os";

const DEFAULT_MQTT_PORT = 3001;
const RACE_STATE_CHANGE_TOPIC = "RaceStateChange";

@Injectable()
export class RaceService {
  private readonly mqttClient: mqtt.MqttClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const port = Number(
      this.configService.get("MQTT_PORT") ?? DEFAULT_MQTT_PORT,
    );
    this.mqttClient = mqtt.connect(`mqtt://${os.hostname()}:${port}`, {
      clientId: "race-service",
    });
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
    const show = await this.prisma.show.findFirst({
      where: { active: true },
      orderBy: { date: "desc" },
      take: 1,
    });
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
    const show = await this.prisma.show.findFirst({
      where: { active: true },
      orderBy: { date: "desc" },
      take: 1,
    });
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

  async createRace(data: Prisma.RaceUncheckedCreateInput): Promise<Race> {
    const highestOrderNumberRace: Race[] = await this.races({
      where: { showId: Number(data.showId) },
      orderBy: { orderNumber: "desc" },
    });
    return this.prisma.race.create({
      data: {
        raceState: this.calculateRaceState(data),
        person1: data.person1,
        song1Id: Number(data.song1Id),
        person2: data.person2,
        song2Id: Number(data.song2Id),
        showId: Number(data.showId),
        createdAt: data.createdAt || new Date(),
        orderNumber:
          highestOrderNumberRace.length > 0
            ? Number(highestOrderNumberRace[0].orderNumber) + 1
            : 0,
      },
    });
  }

  async updateRace(params: {
    where: Prisma.RaceWhereUniqueInput;
    data: Prisma.RaceUncheckedUpdateInput;
  }): Promise<Race> {
    const { where, data } = params;
    const existingRace = await this.prisma.race.findUnique({ where });
    const updatedRace = await this.prisma.race.update({
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

    if (existingRace && existingRace.raceState !== updatedRace.raceState) {
      this.publishRaceStateChange(updatedRace);
    }

    return updatedRace;
  }

  private publishRaceStateChange(race: Race) {
    this.mqttClient.publish(
      RACE_STATE_CHANGE_TOPIC,
      JSON.stringify({ raceId: race.id, state: race.raceState }),
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
      const updateRaceToMove = this.prisma.race.update({
        data: {
          orderNumber: raceToSwitchWith.orderNumber,
        },
        where: { id: raceToMove.id },
      });
      const updateRaceToSwitchWith = this.prisma.race.update({
        data: {
          orderNumber: raceToMove.orderNumber,
        },
        where: { id: raceToSwitchWith.id },
      });

      return this.prisma.$transaction([
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
        showId: {equals: showId},
      },
      orderBy: { orderNumber: "desc" },
      include: { song1: true, song2: true },
    });
    if(!currentRace) {
      console.log(`No active Race found, loading next Listed Race instead`);
      currentRace = await this.prisma.race.findFirst({
        where: {
          raceState: {
            equals: RaceState.LISTED
          },
          showId: {equals: showId},
        },
        orderBy: { orderNumber: "desc" },
        include: { song1: true, song2: true },
      });
    }
    return currentRace;
  }
}
