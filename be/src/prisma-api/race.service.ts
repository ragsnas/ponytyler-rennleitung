import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Prisma, Race } from "@prisma/client";
import { RaceState } from "../race/race.controller";

@Injectable()
export class RaceService {
  constructor(private prisma: PrismaService) {
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
        raceState: { equals: RaceState.WAITING_TO_RACE },
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
    return this.prisma.race.update({
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
      console.log(`> [${indexCounter}] Preparing update for order nr ${race.orderNumber} (race id: ${race.id})`);
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

  async moveRacePosition(params: { raceToMoveId: string, upOrDown: string }) {
    const raceToMove: Race = await this.race({ id: Number(params.raceToMoveId) });
    const orderNumberEqClause = params.upOrDown === "up" ? { lt: raceToMove.orderNumber } : { gt: raceToMove.orderNumber };
    const raceToSwitchWithResults: Race[] = await this.races({
      where: {
        showId: Number(raceToMove.showId),
        raceState: RaceState.WAITING_TO_RACE,
        orderNumber: orderNumberEqClause,
      },
      orderBy: { orderNumber: params.upOrDown === "up" ? "desc" : "asc" },
      take: 1,
    });
    const raceToSwitchWith: Race = raceToSwitchWithResults[0];
    if (raceToSwitchWith) {
      console.log(`>>>>>\nraceToMove #${raceToMove.id}: ${raceToMove.orderNumber}`
        + `\nwill switch with:`
        + `\nraceToSwitchWith #${raceToSwitchWith.id}: ${raceToSwitchWith.orderNumber}`
        + `\n to move "${params.upOrDown}"`);

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

      return this.prisma.$transaction([updateRaceToSwitchWith, updateRaceToMove]);
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
      return RaceState.WAITING_TO_RACE;
    } else if (
      data.raceState === RaceState.WAITING_TO_RACE &&
      !(data.song1Id && data.song2Id && data.person1 && data.person2)
    ) {
      return RaceState.WAITING_FOR_OPPONENT;
    }

    return (data.raceState as RaceState) || RaceState.WAITING_TO_RACE;
  }

  async deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race> {
    return this.prisma.race.delete({
      where,
    });
  }
}
