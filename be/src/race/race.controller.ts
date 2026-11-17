import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
import { RaceControlService } from "./race-control.service";
import { Prisma, RaceState, ShowState } from "@prisma/client";
import { combineLatest, map } from "rxjs";

@Controller("api/race")
export class RaceController {
  constructor(
    private readonly raceService: RaceService,
    private readonly showService: ShowService,
    private readonly raceControlService: RaceControlService,
  ) {}

  @Post()
  create(@Body() data: Prisma.RaceUncheckedCreateInput) {
    return this.raceService.createRace(data);
  }

  @Get("for-show/:showId")
  findRacesForShow(
    @Param("showId") showId: string,
    @Query("raced") raced: string,
  ) {
    return this.raceService.races({
      where: {
        showId: Number(showId),
        raceState: raced
          ? { equals: RaceState.RACED }
          : { not: { equals: RaceState.RACED } },
      },
      orderBy: { orderNumber: raced ? "desc" : "asc" },
    });
  }

  @Get("for-show/:showId/all")
  findAllRacesForShow(@Param("showId") showId: string) {
    return this.raceService.races({
      where: {
        showId: Number(showId),
      },
      orderBy: { orderNumber: "asc" },
    });
  }

  @Get()
  findRaces() {
    return this.raceService.races({});
  }

  @Get("average-races-per-hour")
  calculateAverageRacesPerHour() {
    return combineLatest([
      this.raceService.races({
        where: {
          raceState: { equals: RaceState.RACED },
          show: { showState: { equals: ShowState.SHOW_FINISHED } },
        },
      }),
      this.showService.shows({
        where: {
          showState: { equals: ShowState.SHOW_FINISHED },
        },
      }),
    ]).pipe(
      map(([races, shows]) => {
        const numberOfRaces =
          races
            .map((race) => (race.bikeWon === 3 ? (2 as number) : (1 as number)))
            .reduce(
              (accumulator: number, currentValue: number) =>
                accumulator + currentValue,
              0,
            ) || 0;

        const totalTime =
          shows
            .map((show) => show.duration)
            .reduce(
              (accumulator: number, currentValue: number) =>
                accumulator + currentValue,
              0,
            ) || 0;

        return Math.round(numberOfRaces / (totalTime / 60));
      }),
    );
  }

  @Get("current/:showId")
  findCurrentRace(@Param("showId") showId: string) {
    return this.raceService.currentRace(parseInt(showId));
  }

  @Get("upcoming-race-with-songs")
  findUpcomingRaceWithSongs() {
    return this.raceService.upcomingRaceWithSongs();
  }

  @Get("upcoming-races-with-songs")
  findUpcomingRacesWithSongs() {
    return this.raceService.upcomingRacesWithSongs();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.raceService.race({ id: Number(id) });
  }

  @Get(":id/with-songs")
  findOneWithSongs(@Param("id") id: string) {
    return this.raceService.raceWithSongs(id);
  }

  /**
   * An operator action on the race (see race-transitions.ts): moves the race
   * and its show together, or answers 409 when the race is in a state the
   * action does not fit. Responds with the race and the show as they are now.
   */
  @Post(":id/transition")
  transition(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { action?: string },
  ) {
    return this.raceControlService.transition(id, body?.action);
  }

  @Patch(":id/:upOrDown")
  async moveRaceUpOrDown(
    @Param("id") id: string,
    @Param("upOrDown") upOrDown: string,
  ) {
    return this.raceService.moveRacePosition({ raceToMoveId: id, upOrDown });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() data: Prisma.RaceUncheckedUpdateInput,
  ) {
    return this.raceService.updateRace({ where: { id: Number(id) }, data });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.raceService.deleteRace({ id: Number(id) });
  }
}
