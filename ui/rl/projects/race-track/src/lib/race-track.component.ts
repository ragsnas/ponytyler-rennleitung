import {Component, OnDestroy, OnInit} from '@angular/core';
import {map, Observable, Subject, takeUntil, takeWhile, timer} from "rxjs";

interface PlayerData {
  progress: number;
  averageSpeedInKmh: number;
  timeInSeconds: number;
}

@Component({
  selector: 'lib-race-track',
  templateUrl: 'race-track.component.html',
  styleUrls: ['race-track.component.html']
})
export class RaceTrackComponent implements OnInit, OnDestroy {

  fakePlayer1Data$: Subject<PlayerData> = new Subject<PlayerData>();
  player1Progress$: Observable<number> = this.fakePlayer1Data$.pipe(map((playerData: PlayerData) => playerData.progress));
  player1AverageSpeed$: Observable<number> = this.fakePlayer1Data$.pipe(map((playerData: PlayerData) => playerData.averageSpeedInKmh));
  player1timeInSeconds$: Observable<number> = this.fakePlayer1Data$.pipe(map((playerData: PlayerData) => playerData.timeInSeconds));

  fakePlayer2Data$: Subject<PlayerData> = new Subject<PlayerData>();
  player2Progress$: Observable<number> = this.fakePlayer2Data$.pipe(map(playerData => playerData.progress));
  player2AverageSpeed$: Observable<number> = this.fakePlayer2Data$.pipe(map((playerData: PlayerData) => playerData.averageSpeedInKmh));
  player2timeInSeconds$: Observable<number> = this.fakePlayer2Data$.pipe(map((playerData: PlayerData) => playerData.timeInSeconds));
  private unsubscribe$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    console.log(`ng on init called`);
    let player1Progress: number = 0;
    let player2Progress: number = 0;
    const timer$ = timer(0, 100).pipe(
      takeUntil(this.unsubscribe$),
      takeWhile(() => player1Progress < 100 && player2Progress < 100),
    ).subscribe((timer) => {
      console.log(`\nSetting Player Progress for Players`);

      player1Progress = this.setPlayerProgress(this.fakePlayer1Data$, player1Progress, timer);
      player2Progress = this.setPlayerProgress(this.fakePlayer2Data$, player2Progress, timer);
    });

  }

  private setPlayerProgress(playerData$: Subject<PlayerData>, playerProgress: number, timer: number) {
    const currentPlayerProgress = Math.random();
    playerProgress += currentPlayerProgress;
    console.log(`\nSetting Player Progress:`, playerProgress);
    playerData$.next({
      progress: playerProgress,
      averageSpeedInKmh: currentPlayerProgress * 50,
      timeInSeconds: timer / 1000
    })
    return playerProgress;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
