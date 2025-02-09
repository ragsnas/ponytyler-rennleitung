import {
  Controller,
  Param,
  Get,
  Post,
  Body,
  Patch,
  NotFoundException,
  Delete, Query,
} from "@nestjs/common";
import { ShiftsService } from "../prisma-api/shifts.service";
import { Shift, Prisma } from "@prisma/client";
import { RaceState } from "../race/race.controller";

@Controller("api/shifts")
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService
  ) {}

  @Get("")
  async getShows(): Promise<Shift[]> {
    return this.shiftsService.shifts({
      orderBy: { order: 'desc' },
    });
  }

  @Get("for-show/:showId")
  findShiftsForShow(
    @Param("showId") showId: string
  ) {
    return this.findShiftsForShow(showId);
  }

  @Post()
  create(@Body() data: Prisma.ShiftUncheckedCreateInput) {
    return this.shiftsService.createShift(data);
  }
}
