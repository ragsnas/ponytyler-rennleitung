import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Shift, Prisma } from "@prisma/client";

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async shift(
    shiftWhereUniqueInput: Prisma.ShiftWhereUniqueInput,
  ): Promise<Shift | null> {
    return this.prisma.shift.findUnique({
      where: shiftWhereUniqueInput,
    });
  }

  async shifts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ShiftWhereUniqueInput;
    where?: Prisma.ShiftWhereInput;
    orderBy?: Prisma.ShiftOrderByWithRelationInput;
  }): Promise<Shift[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.shift.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createShift(data: Prisma.ShiftUncheckedCreateInput): Promise<Shift> {
    return this.prisma.shift.create({
      data,
    });
  }

  async updateShift(params: {
    where: Prisma.ShiftWhereUniqueInput;
    data: Prisma.ShiftUpdateInput;
  }): Promise<Shift> {
    const { where, data } = params;
    return this.prisma.shift.update({
      data,
      where,
    });
  }

  async deleteShift(where: Prisma.ShiftWhereUniqueInput): Promise<Shift> {
    return this.prisma.shift.delete({
      where,
    });
  }

  shiftsForShow(showId: string) {
    return this.shifts({where: {showId: Number(showId)}});
  }
}
