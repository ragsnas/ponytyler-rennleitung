import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Race, Prisma } from '@prisma/client';

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
    data: Prisma.RaceUpdateInput;
  }): Promise<Race> {
    const { where, data } = params;
    return this.prisma.race.update({
      data,
      where,
    });
  }

  async deleteRace(where: Prisma.RaceWhereUniqueInput): Promise<Race> {
    return this.prisma.race.delete({
      where,
    });
  }
}
