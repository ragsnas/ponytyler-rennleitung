import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {Race, RaceService, RaceState} from 'projects/backend-api/src/lib/race.service';
import {StatisticsService} from 'projects/backend-api/src/lib/statistics.service';
import {Show, ShowService} from 'projects/backend-api/src/lib/show.service';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  interval,
  map,
  Observable,
  of,
  startWith,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  timer
} from 'rxjs';
import {MatSnackBar} from "@angular/material/snack-bar";
import {FormControl} from "@angular/forms";
import {MatSelectChange} from '@angular/material/select';
import {MatDialog} from "@angular/material/dialog";
import {YesNoDialogComponent} from "projects/ui/yes-no-dialog/src/lib/yes-no-dialog.component"

export interface RaceWithSongPlayedInfo extends Race {
  song1AlreadyPlayed: boolean;
  song1AlreadyWished: boolean;
  song2AlreadyPlayed: boolean;
  song2AlreadyWished: boolean;
}

const PONTY_TYPER_REFRESH_TIMER_INTERVAL = 'pontyTyperRefreshTimerInterval';

function compareRaceState(race1: Race, race2: Race) {
  const order = {
    [RaceState.WAITING_TO_RACE]: 1,
    [RaceState.WAITING_FOR_OPPONENT]: 2,
    [RaceState.RACED]: 3,
    [RaceState.CANCELED]: 4,
  }
  if (order[race1.raceState as RaceState] > order[race2.raceState as RaceState]) {
    return 1;
  }
  if (order[race1.raceState as RaceState] < order[race2.raceState as RaceState]) {
    return -1;
  }
  return 0;
}

function compareRacesByOrderNumber(race1: Race, race2: Race, direction: 'asc' | 'desc') {
  if (race1.orderNumber > race2.orderNumber) {
    return 1 * (direction === 'asc' ? 1 : -1);
  }
  if (race1.orderNumber < race2.orderNumber) {
    return -1 * (direction === 'asc' ? 1 : -1);
  }
  return 0;
}

function sortRacesForList() {
  return (race1: Race, race2: Race): number => {
    const raceStateSortResult = compareRaceState(race1, race2);
    if (raceStateSortResult !== 0) {
      return raceStateSortResult;
    } else if (race1.raceState === RaceState.WAITING_TO_RACE || race1.raceState === RaceState.WAITING_FOR_OPPONENT) {
      return compareRacesByOrderNumber(race1, race2, 'asc');
    } else if (race1.raceState === RaceState.RACED || race1.raceState === RaceState.CANCELED) {
      return compareRacesByOrderNumber(race1, race2, 'desc');
    }
    return 0;
  };
}

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
  refreshIntervalFormControl: FormControl<string> = new FormControl<string>(localStorage.getItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL) || '5000', {nonNullable: true});
  refresh$: Subject<void> = new Subject<void>();
  unsubscribe$: Subject<void> = new Subject<void>();
  timerSubscription: Subscription = new Subscription();
  loadRacesSubscription: Subscription = new Subscription();
  secondsRemaining$: Observable<number> = of(0);
  isListFull: boolean = false;
  moreThanOnePersonWaitingForOpponent: boolean = false;

  constructor(
    private showService: ShowService,
    private raceService: RaceService,
    private statisticsService: StatisticsService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.statisticsService.isListFull(
      this.route.snapshot.paramMap.get('showId')!
    ).subscribe(isListFull =>
      this.isListFull = isListFull);
    this.setTimer(Number(this.refreshIntervalFormControl.getRawValue()));
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
            this.raceService.getAllRacesForShow(showId),
          ])));
      })
    ).subscribe({
      next: ([show, races]) => {
        this.show = show;
        const finishedRaces = races.filter(race => race.raceState === RaceState.RACED);
        this.finishedRaces$.next(finishedRaces);
        this.races$.next(this.addAlreadyPlayedInfoToRacesFromFinishedRaces(
          races.sort(sortRacesForList()),
          finishedRaces
        ));
        this.moreThanOnePersonWaitingForOpponent = races.filter((race: Race) => race.raceState === RaceState.WAITING_FOR_OPPONENT).length > 1;
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
    if(race.raceState !== RaceState.WAITING_TO_RACE) {
      this.snackBar.open(`Can't mark Winning Bike if Race is not Waiting to be Raced`, 'OK', {
        duration: 5000, announcementMessage: `Error`, panelClass: 'error'
      })
    } else {
      this.raceService
        .updateRace({
          ...race,
          bikeWon: bike,
          raceState: RaceState.RACED,
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

  }

  markRaceAsPlayBoth(race: Race): void {
    this.raceService
      .updateRace({
        ...race,
        raced: true,
        raceState: RaceState.RACED,
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

  markRaceAsCanceled(race: Race): void {
    this.raceService
      .updateRace({
        ...race,
        raced: true,
        raceState: RaceState.CANCELED
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
      .updateRace({...race, raced: false, bikeWon: 0, raceState: RaceState.WAITING_TO_RACE} as Race)
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

  refreshIntervalChange($event: MatSelectChange) {
    localStorage.setItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL, $event.value);
    if ($event.value === 'stop') {
      this.stopTimer();
    } else {
      this.setTimer($event.value);
    }
  }

  private addAlreadyPlayedInfoToRacesFromFinishedRaces(races: Race[], finishedRaces: Race[]): RaceWithSongPlayedInfo[] {
    const racesWaitingToRace = races.filter(race => race.raceState === RaceState.WAITING_TO_RACE || race.raceState === RaceState.WAITING_FOR_OPPONENT);
    return races.map((race: Race) => ({
      ...race,
      song1AlreadyPlayed: this.getSongAlreadyPlayed(finishedRaces, race.song1Id),
      song1AlreadyWished: this.getSongAlreadyWished(racesWaitingToRace, race.id, race.song1Id),
      song2AlreadyPlayed: this.getSongAlreadyPlayed(finishedRaces, race.song2Id),
      song2AlreadyWished: this.getSongAlreadyWished(racesWaitingToRace, race.id, race.song2Id),
    }));
  }

  private getSongAlreadyPlayed(races: Race[], songId: string | undefined) {
    return races.some((race: Race) =>
      (race.song1Id && race.song1Id === songId && (race.bikeWon === 1 || race.bikeWon === 3))
      ||
      (race.song2Id && race.song2Id === songId && (race.bikeWon === 2 || race.bikeWon === 3))
    );
  }

  private getSongAlreadyWished(races: Race[], raceId: string | undefined, songId: string | undefined) {
    return races.some((race: Race) =>
      ((race.song1Id && race.song1Id === songId) || (race.song2Id && race.song2Id === songId)) && race.id !== raceId
    );
  }

  private setTimer(timerInterval: number): void {
    this.secondsRemaining$ = timer(0, 1000).pipe(
      map(n => timerInterval - n*1000),
      takeWhile(n => n >= 0),
    );
    this.timerSubscription.unsubscribe();
    this.timerSubscription = interval(timerInterval).pipe(
      takeUntil(this.unsubscribe$),
      tap(() => this.refreshing = true),
      delay(600),
    ).subscribe(() => {
      this.refresh$.next();
    });
  }

  private stopTimer(): void {
    this.secondsRemaining$ = of(0);
    this.timerSubscription.unsubscribe();
  }

  deleteShow() {
    const dialog = this.dialog.open(YesNoDialogComponent, {
      data: {
        title: `Do you want to delete the Show "${this.show?.name}"?`,
        text: `This will delete the Show and all the related Races.`,
        optionYes: 'Yes, Delete',
        optionNo: 'No, Cancel'
      }
    });
    dialog.afterClosed().subscribe(result => {
      if(result) {
        this.showService.deleteShow(this.show?.id as string).subscribe({
          next: (result) => {
            this.snackBar.open(`Show was deleted`, 'OK', {panelClass: 'success', duration: 500});
            this.router.navigate(['../']);
          },
          error: (error) => {
            this.snackBar.open(`Show could not be deleted: ${JSON.stringify(error)}`, 'OK', {
              duration: 10000, panelClass: 'error'
            });
          },
        });
      }
    });
  }

  mergeTopWaitingForOpponentRaces(race: Race) {
    const race1: Race = race;
    const otherRaceWaitingForOpponent: Race | undefined = this.races$.value.find((otherRace: Race) => race.id !== otherRace.id && otherRace.raceState === RaceState.WAITING_FOR_OPPONENT);
    if(race && otherRaceWaitingForOpponent) {
      const person1 = race.person1 || race.person2;
      const song1Id = race.song1Id || race.song2Id;
      const person2 = otherRaceWaitingForOpponent.person1 || otherRaceWaitingForOpponent.person2;
      const song2Id = otherRaceWaitingForOpponent.song1Id || otherRaceWaitingForOpponent.song2Id;
      combineLatest([
        this.raceService.updateRace({
          ...race1,
          person1,
          song1Id,
          person2,
          song2Id,
          raceState: RaceState.WAITING_TO_RACE
        }),
        this.raceService.updateRace({
          ...otherRaceWaitingForOpponent,
          raceState: RaceState.CANCELED,
          raced: false,
          bikeWon: 0
        })
      ]).subscribe({
        next: () => {
          this.snackBar.open(`Races where merged successfully`, 'OK', {panelClass: 'success', duration: 500});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Races could not be merged: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
    }
  }
}
