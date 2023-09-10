import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Race, Prisma } from '@prisma/client';

@Injectable()
export class RaceService {
  constructor(private prisma: PrismaService) {}

  async Race(
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

  async createRace(data: Prisma.RaceCreateInput): Promise<Race> {
    return this.prisma.race.create({
      data,
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
