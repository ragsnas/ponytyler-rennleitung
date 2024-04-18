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
import {RaceService} from 'src/prisma-api/race.service';
import {Prisma} from '@prisma/client';

export enum RaceState {
    WAITING_FOR_OPPONENT = 'WAITING_FOR_OPPONENT',
    WAITING_TO_RACE = 'WAITING_TO_RACE',
    CANCELED = 'CANCELED',
    RACED = 'RACED',
}


@Controller('api/race')
export class RaceController {
    constructor(private readonly raceService: RaceService) {
    }

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
            where: {
                showId: Number(showId),
                raceState: raced ? {equals: RaceState.RACED} : {not: {equals: RaceState.RACED}}
            },
            orderBy: {orderNumber: raced ? 'desc' : 'asc'},
        });
    }

    @Get('for-show/:showId/all')
    findAllRacesForShow(
        @Param('showId') showId: string
    ) {
        return this.raceService.races({
            where: {
                showId: Number(showId)
            },
            orderBy: {orderNumber: 'asc'},
        });
    }

    @Get()
    findRaces() {
        return this.raceService.races({});
    }

    @Get('upcoming-with-songs')
    findUpcomingRaceWithSongs() {
        return this.raceService.upcomingRaceWithSongs();
    }


    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.raceService.race({id: Number(id)});
    }

    @Get(':id/with-songs')
    findOneWithSongs(@Param('id') id: string) {
        return this.raceService.raceWithSongs(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() data: Prisma.RaceUncheckedUpdateInput,
    ) {
        return this.raceService.updateRace({where: {id: Number(id)}, data});
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.raceService.deleteRace({id: Number(id)});
    }
}
