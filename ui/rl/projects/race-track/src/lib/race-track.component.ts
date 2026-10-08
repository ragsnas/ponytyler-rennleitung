import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RaceState } from "projects/backend-api/src/lib/race.service";

export interface BikeData {
  progressInMm: number;
  progressInPercent: number;
  averageSpeedInKmh: number;
  timeInSeconds: number;
}

@Component({
  selector: 'lib-race-track',
  templateUrl: 'race-track.component.html',
  styleUrls: ['race-track.component.html'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RaceTrackComponent {

  @Input()
  raceState: RaceState = RaceState.RACING;

  @Input()
  bike1: BikeData | null = {
    progressInMm: 0,
    averageSpeedInKmh: 0,
    progressInPercent: 0,
    timeInSeconds: 0
  };

  @Input()
  bike2: BikeData | null = {
    progressInMm: 0,
    averageSpeedInKmh: 0,
    progressInPercent: 0,
    timeInSeconds: 0
  }
}
