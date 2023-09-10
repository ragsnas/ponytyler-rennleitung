import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RaceService } from 'src/prisma-api/race.service';
import { Prisma } from '@prisma/client';

@Controller('api/race')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  @Post()
  create(@Body() data: Prisma.RaceCreateInput) {
    return this.raceService.createRace(data);
  }

  @Get('for-show/:showId')
  findRacesForShow(@Param('showId') showId: string) {
    return this.raceService.races({
      where: { showId: Number(showId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.raceService.Race({ id: Number(id) });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.RaceUpdateInput) {
    return this.raceService.updateRace({ where: { id: Number(id) }, data });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.raceService.deleteRace({ id: Number(id) });
  }
}
