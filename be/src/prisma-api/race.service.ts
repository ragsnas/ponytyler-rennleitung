import { Injectable } from '@nestjs/common';
import { Prisma, Race } from '@prisma/client';
import { PrismaService } from './prisma.service';

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
    console.log(`updating race`);
    return this.prisma.race.update({
      data: {
        person1: data.person1,
        song1: { connect: { id: Number(data.song1Id) } },
        person2: data.person1,
        song2: { connect: { id: Number(data.song2Id) } },
        createdAt: data.createdAt,
        orderNumber: data.orderNumber,
        raced: data.raced,
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
