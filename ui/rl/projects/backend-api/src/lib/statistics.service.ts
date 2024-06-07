import {Injectable} from "@angular/core";
import {Show, ShowService} from "./show.service";
import {Race, RaceService, RaceState} from "./race.service";
import {combineLatest, map, Observable} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  constructor(
    private raceService: RaceService,
    private showService: ShowService
  ) {
  }

  isListFull(showId: string): Observable<boolean> {
    return combineLatest([
      this.raceService.averageRacesPerHour(),
      this.raceService.getAllRacesForShow(showId, true).pipe(
        map((races: Race[]) => races.filter((race: Race) => race.raceState === RaceState.RACED || race.raceState === RaceState.WAITING_TO_RACE || race.raceState === RaceState.WAITING_FOR_OPPONENT))
      ),
      this.showService.getShow(showId)
    ]).pipe(
      map(([averageRacesPerHour, races, show]: [number, Race[], Show]) => {
        return races.length > Math.round((show.duration / 60) * averageRacesPerHour);
      })
    );
  }
}
