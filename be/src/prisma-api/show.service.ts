import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Show, Prisma } from "@prisma/client";

@Injectable()
export class ShowService {
  constructor(private prisma: PrismaService) {}

  async show(
    ShowWhereUniqueInput: Prisma.ShowWhereUniqueInput,
  ): Promise<Show | null> {
    return this.prisma.show.findUnique({
      where: ShowWhereUniqueInput,
    });
  }

  async shows(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ShowWhereUniqueInput;
    where?: Prisma.ShowWhereInput;
    orderBy?: Prisma.ShowOrderByWithRelationInput;
  }): Promise<Show[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.show.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async showsOrderedByActiveAndDate(): Promise<Show[]> {
    return this.prisma.show.findMany({
      orderBy: [{ active: "desc" }, { date: "desc" }],
    });
  }

  async createShow(data: Prisma.ShowCreateInput): Promise<Show> {
    return this.prisma.show.create({
      data,
    });
  }

  async updateShow(params: {
    where: Prisma.ShowWhereUniqueInput;
    data: Prisma.ShowUpdateInput;
  }): Promise<Show> {
    const { where, data } = params;
    return this.prisma.show.update({
      data,
      where,
    });
  }

  async deleteShow(where: Prisma.ShowWhereUniqueInput): Promise<Show> {
    return this.prisma.show.delete({
      where,
    });
  }

  deleteShowWithRaces(id: string) {
    const deleteRaces = this.prisma.race.deleteMany({
      where: {
        showId: Number(id),
      },
    });

    const deleteShow = this.prisma.show.delete({
      where: {
        id: Number(id),
      },
    });

    return this.prisma.$transaction([deleteRaces, deleteShow]);
  }
}
