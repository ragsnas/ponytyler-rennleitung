import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RaceService } from 'src/prisma-api/race.service';
import { Prisma } from '@prisma/client';

@Controller('api/race')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  @Post()
  create(@Body() data: Prisma.RaceUncheckedCreateInput) {
    return this.raceService.createRace(data);
  }

  @Get('for-show/:showId')
  findRacesForShow(
    @Param('showId') showId: string,
    @Query('raced') raced: string,
  ) {
    return this.raceService.races({
      where: { showId: Number(showId), raced: raced ? true : false },
      orderBy: { orderNumber: 'asc' },
    });
  }

  @Get()
  findRaces() {
    return this.raceService.races({});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.raceService.race({ id: Number(id) });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.RaceUncheckedUpdateInput,
  ) {
    return this.raceService.updateRace({ where: { id: Number(id) }, data });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.raceService.deleteRace({ id: Number(id) });
  }
}
