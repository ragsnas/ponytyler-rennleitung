import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import {map, Observable, Subject, takeUntil, takeWhile, timer} from "rxjs";
import { RaceState } from "projects/backend-api/src/lib/race.service";

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

  @Input()
  raceState: RaceState = RaceState.RACING;

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

  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private static brokerUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/mqtt-ws`;
  }
}
