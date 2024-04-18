import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma, Race } from "@prisma/client";
import {RaceState} from "../race/race.controller";

@Injectable()
export class RaceService {
  constructor(private prisma: PrismaService) {}

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
    console.log(`upcomingRaceWithSongs Called`);
    const show = await this.prisma.show.findFirst({
      where: { active: true },
      orderBy: {date: 'desc'},
      take: 1
    });
    console.log(`Found current show:`, show);
    return this.prisma.race.findFirst({
      where: { showId: Number(show.id), raceState: {equals: RaceState.WAITING_TO_RACE} },
      include: { song1: true, song2: true },
      orderBy: {orderNumber: 'asc'}
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
      orderBy: { orderNumber: 'desc' },
    });
    return this.prisma.race.create({
      data: {
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
        song1: { connect: { id: Number(data.song1Id) } },
        person2: data.person2,
        song2: { connect: { id: Number(data.song2Id) } },
        createdAt: data.createdAt,
        orderNumber: data.orderNumber,
        raced: data.raced,
        raceState: data.raceState,
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

  async deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race> {
    return this.prisma.race.delete({
      where,
    });
  }
}
