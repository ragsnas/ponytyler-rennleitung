import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma-api/prisma.service";
import { DatabaseExport, DATABASE_EXPORT_FORMAT_VERSION } from "./export.types";

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportDatabase(): Promise<DatabaseExport> {
    const [shows, shifts, shiftRoles, songs, races, users] = await Promise.all([
      this.prisma.show.findMany({ orderBy: { id: "asc" } }),
      this.prisma.shift.findMany({ orderBy: { id: "asc" } }),
      this.prisma.shiftRole.findMany({ orderBy: { id: "asc" } }),
      this.prisma.song.findMany({ orderBy: { id: "asc" } }),
      this.prisma.race.findMany({ orderBy: { id: "asc" } }),
      this.prisma.user.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return {
      formatVersion: DATABASE_EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      shows,
      shifts,
      shiftRoles,
      songs,
      races,
      users,
    };
  }
}
