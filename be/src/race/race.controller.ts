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
import {ShowService} from "src/prisma-api/show.service";
import {Prisma, Race, Show} from "@prisma/client";
import {combineLatest, map} from "rxjs";


export enum RaceState {
    WAITING_FOR_OPPONENT = 'WAITING_FOR_OPPONENT',
    WAITING_TO_RACE = 'WAITING_TO_RACE',
    CANCELED = 'CANCELED',
    RACED = 'RACED',
}

@Controller('api/race')
export class RaceController {
    constructor(
        private readonly raceService: RaceService,
        private readonly showService: ShowService
    ) {
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

    @Get('average-races-per-hour')
    calculateAverageRacesPerHour() {
        return combineLatest([
            this.raceService.races({
                where: {
                    raceState: {equals: RaceState.RACED},
                    show: {finished: {equals: true}}
                },
            }),
            this.showService.shows({
                where: {
                    finished: {equals: true}
                },
            })
        ]).pipe(map(([races, shows]) => {
            const numberOfRaces = races
                .map(race => race.bikeWon === 3 ? 2 as number : 1 as number)
                .reduce((accumulator: number, currentValue: number) => accumulator + currentValue) || 0;

            const totalTime = shows
                .map(show => show.duration)
                .reduce((accumulator: number, currentValue: number) => accumulator + currentValue) || 0;

            return Math.round(numberOfRaces / (totalTime / 60))
        }));

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
