import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Race, RaceService} from 'projects/backend-api/src/lib/race.service';
import {Show, ShowService} from 'projects/backend-api/src/lib/show.service';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  interval,
  Observable,
  of,
  startWith,
  Subject, Subscription,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {MatSnackBar} from "@angular/material/snack-bar";
import {FormControl, FormGroup} from "@angular/forms";
import { MatSelectChange } from '@angular/material/select';

export interface RaceWithSongPlayedInfo extends Race {
  song1AlreadyPlayed: boolean;
  song1AlreadyWished: boolean;
  song2AlreadyPlayed: boolean;
  song2AlreadyWished: boolean;
}

const PONTY_TYPER_REFRESH_TIMER_INTERVAL = 'pontyTyperRefreshTimerInterval';

@Component({
  selector: 'lib-show-dashboard',
  templateUrl: './show-dashboard.component.html',
  styleUrls: ['./show-dashboard.component.scss'],
})
export class ShowDashboardComponent implements OnInit, OnDestroy {
  show: Show | undefined;
  races$: BehaviorSubject<RaceWithSongPlayedInfo[]> = new BehaviorSubject<RaceWithSongPlayedInfo[]>([]);
  finishedRaces$: BehaviorSubject<Race[]> = new BehaviorSubject<Race[]>([]);
  refreshing: boolean = false;
  refreshIntervalFormControl: FormControl<string> = new FormControl<string>('5000', {nonNullable: true});
  timer$: Observable<number> = of(0);
  refresh$: Subject<void> = new Subject<void>();
  unsubscribe$: Subject<void> = new Subject<void>();
  loadRacesSubscription: Subscription = new Subscription();

  constructor(
    private showService: ShowService,
    private raceService: RaceService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    const refreshInterval = Number(localStorage.getItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL)) || Number(this.refreshIntervalFormControl.getRawValue());
    this.setTimer(refreshInterval);
    this.loadRaces();
  }

  loadRaces() {
    this.loadRacesSubscription.unsubscribe();
    this.loadRacesSubscription = this.route.paramMap.pipe(
      takeUntil(this.unsubscribe$),
      switchMap((params: ParamMap) => {
        const showId = params.get('showId') as string;
        return this.refresh$.pipe(
          takeUntil(this.unsubscribe$),
          startWith(0),
          switchMap(() => combineLatest([
            this.showService.getShow(showId),
            this.raceService.getRacesForShow(showId),
            this.raceService.getRacesForShow(showId, true)
          ])));
      })
    ).subscribe({
      next: ([show, races, finishedRaces]) => {
        this.show = show;
        this.finishedRaces$.next(finishedRaces);
        this.races$.next(this.addAlreadyPlayedInfoToRacesFromFinishedRaces(races, finishedRaces));
        this.refreshing = false;
      },
      error: (error) => {
        this.snackBar.open(`Error during loading of Data: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, announcementMessage: `Error`, panelClass: 'error'
        });
      }
    });

  }

  bikeWon(bike: number, race: Race) {
    console.log(`bikeWon > called with bike:`, bike);

    this.raceService
      .updateRace({
        ...race,
        bikeWon: bike,
        raced: true,
      } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as "Bike ${bike} won!" Congrats ${bike === 1 ? race.person1 : race.person2}`, 'OK', {
            panelClass: 'success',
            duration: 500
          });
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, announcementMessage: `Error`, panelClass: 'error'
          });
        },
      });
  }

  markRaceAsPlayBoth(race: Race): void {
    this.raceService
      .updateRace({
        ...race,
        raced: true,
        bikeWon: 3
      } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as "Both Won"`, 'OK', {panelClass: 'success', duration: 500});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during Marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
  }

  markRaceAsRaced(race: Race): void {
    this.raceService
      .updateRace({
        ...race,
        raced: true,
      } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as over`, 'OK', {panelClass: 'success', duration: 500});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during Marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
  }

  markRaceAsNotRaced(race: Race): void {
    this.raceService
      .updateRace({...race, raced: false, bikeWon: 0} as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as NOT over`, 'OK', {panelClass: 'success', duration: 500});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during Marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
  }

  private addAlreadyPlayedInfoToRacesFromFinishedRaces(races: Race[], finishedRaces: Race[]): RaceWithSongPlayedInfo[] {

    return races.map((race: Race) => ({
      ...race,
      song1AlreadyPlayed: this.getSongAlreadyPlayed(finishedRaces, race.song1Id),
      song1AlreadyWished: this.getSongAlreadyWished(races, race.id, race.song1Id),
      song2AlreadyPlayed: this.getSongAlreadyPlayed(finishedRaces, race.song2Id),
      song2AlreadyWished: this.getSongAlreadyWished(races, race.id, race.song2Id),
    }));
  }

  private getSongAlreadyPlayed(races: Race[], songId: string | undefined) {
    return races.some((race: Race) =>
      (race.song1Id === songId && (race.bikeWon === 1 || race.bikeWon === 3))
      ||
      (race.song2Id === songId && (race.bikeWon === 2 || race.bikeWon === 3))
    );
  }

  private getSongAlreadyWished(races: Race[], raceId: string | undefined, songId: string | undefined) {
    return races.some((race: Race) =>
      (race.song1Id === songId || race.song2Id === songId) && race.id !== raceId
    );
  }

  refreshIntervalChange($event: MatSelectChange) {
    console.log(`refreshIntervalChange`, $event.value);
    localStorage.setItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL, $event.value);
    this.setTimer($event.value);
  }

  private setTimer(timerInterval: number): void {
    console.log(`setting timer to:`, timerInterval);
    this.timer$ = interval(timerInterval).pipe(
      takeUntil(this.unsubscribe$),
      tap(() => {
        console.log(`timer calls`);
        this.refreshing = true;
        this.refresh$.next();
      }),
      delay(500),
    );
  }
}
