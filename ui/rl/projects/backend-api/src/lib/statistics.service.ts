import { Injectable } from "@angular/core";
import { Show, ShowService } from "./show.service";
import { Race, RaceService, RaceState } from "./race.service";
import { combineLatest, map, Observable } from "rxjs";
import { environment } from "../../../../src/environments/environment";
import { HttpClient } from "@angular/common/http";

export interface StatSong {
  artist: string;
  name: string;
  totalCount?: number;
}

@Injectable({
  providedIn: "root",
})
export class StatisticsService {
  constructor(
    private raceService: RaceService,
    private showService: ShowService,
    private http: HttpClient,
  ) {
  }

  isListFull(showId: string): Observable<boolean> {
    return combineLatest([
      this.raceService.averageRacesPerHour(),
      this.raceService.getAllRacesForShow(showId, true).pipe(
        map((races: Race[]) => races.filter((race: Race) => race.raceState === RaceState.RACED || race.raceState === RaceState.WAITING_TO_RACE || race.raceState === RaceState.WAITING_FOR_OPPONENT)),
      ),
      this.showService.getShow(showId),
    ]).pipe(
      map(([averageRacesPerHour, races, show]: [number, Race[], Show]) => {
        return races.length > Math.round((show.duration / 60) * averageRacesPerHour);
      }),
    );
  }

  mostPlayedSongs(): Observable<StatSong[]> {
    return this.http.get<StatSong[]>(`${environment.apiUrl}api/statistics/most-played-songs`).pipe(result => {
      return result;

    });
  }

  mostWishedSongs(): Observable<StatSong[]> {
    return this.http.get<StatSong[]>(`${environment.apiUrl}api/statistics/most-wished-songs`).pipe(result => {
      return result;

    });
  }

  neverWishedSongs(): Observable<StatSong[]> {
    return this.http.get<StatSong[]>(`${environment.apiUrl}api/statistics/never-wished-songs`).pipe(result => {
      return result;

    });
  }
}
