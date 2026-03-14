import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {map, Observable, Subject, takeUntil, takeWhile, timer} from "rxjs";

interface PlayerData {
  progress: number;
  averageSpeedInKmh: number;
  timeInSeconds: number;
}

@Component({
  selector: 'lib-race-track',
  templateUrl: 'race-track.component.html',
  styleUrls: ['race-track.component.scss']
})
export class RaceTrackComponent implements AfterViewInit, OnInit, OnDestroy {

  fakePlayer1Data$: Subject<PlayerData> = new Subject<PlayerData>();
  player1Progress$: Observable<number> = this.fakePlayer1Data$.pipe(map((playerData: PlayerData) => playerData.progress));
  player1AverageSpeed$: Observable<number> = this.fakePlayer1Data$.pipe(map((playerData: PlayerData) => playerData.averageSpeedInKmh));
  player1timeInSeconds$: Observable<number> = this.fakePlayer1Data$.pipe(map((playerData: PlayerData) => playerData.timeInSeconds));

  fakePlayer2Data$: Subject<PlayerData> = new Subject<PlayerData>();
  player2Progress$: Observable<number> = this.fakePlayer2Data$.pipe(map(playerData => playerData.progress));
  player2AverageSpeed$: Observable<number> = this.fakePlayer2Data$.pipe(map((playerData: PlayerData) => playerData.averageSpeedInKmh));
  player2timeInSeconds$: Observable<number> = this.fakePlayer2Data$.pipe(map((playerData: PlayerData) => playerData.timeInSeconds));
  
  private unsubscribe$: Subject<void> = new Subject<void>();

  @ViewChild('whiteBikePath') whiteBikePath!: ElementRef<SVGPathElement>;
  @ViewChild('blackBikePath') blackBikePath!: ElementRef<SVGPathElement>;
  
  public whitePathLength: number = 0;
  public blackPathLength: number = 0;
  public whiteDashOffset: number = 0;
  public blackDashOffset: number = 0;

  ngOnInit(): void {
    let player1Progress: number = 0;
    let player2Progress: number = 0;

    // Listen to progress changes to update offsets
    this.player1Progress$.pipe(takeUntil(this.unsubscribe$)).subscribe(progress => {
      this.whiteDashOffset = this.calculateOffset(progress, this.whitePathLength);
    });

    this.player2Progress$.pipe(takeUntil(this.unsubscribe$)).subscribe(progress => {
      this.blackDashOffset = this.calculateOffset(progress, this.blackPathLength);
    });

    const timer$ = timer(0, 100).pipe(
      takeUntil(this.unsubscribe$),
      takeWhile(() => player1Progress < 100 && player2Progress < 100),
    ).subscribe((timer) => {
      player1Progress = this.setPlayerProgress(this.fakePlayer1Data$, player1Progress, timer);
      player2Progress = this.setPlayerProgress(this.fakePlayer2Data$, player2Progress, timer);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.whiteBikePath) {
        const length = this.whiteBikePath.nativeElement.getTotalLength();
        this.whitePathLength = length;
        this.whiteDashOffset = length;
      }
      if (this.blackBikePath) {
        const length = this.blackBikePath.nativeElement.getTotalLength();
        this.blackPathLength = length;
        this.blackDashOffset = length;
      }
    });
  }

  private calculateOffset(progress: number, totalLength: number): number {
    const p = Math.min(Math.max(progress, 0), 100);
    return totalLength - (p * totalLength / 100);
  }

  private setPlayerProgress(playerData$: Subject<PlayerData>, playerProgress: number, timer: number) {
    const currentPlayerProgress = Math.random();
    playerProgress += currentPlayerProgress;
    playerData$.next({
      progress: playerProgress,
      averageSpeedInKmh: currentPlayerProgress * 50,
      timeInSeconds: timer / 1000
    });
    return playerProgress;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}