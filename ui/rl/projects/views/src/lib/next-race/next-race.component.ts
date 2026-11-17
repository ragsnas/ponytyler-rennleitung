import {Component, ChangeDetectionStrategy} from '@angular/core';
import {Race, RaceService} from 'projects/backend-api/src/lib/race.service';
import {LiveUpdatesService} from 'projects/mqtt-broker/src/lib/live-updates.service';
import {catchError, EMPTY, Observable, startWith, switchMap} from "rxjs";

@Component({
    selector: 'lib-next-race',
    templateUrl: './next-race.component.html',
    styleUrls: ['./next-race.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NextRaceComponent {

  /** The upcoming race now, and again whenever the live updates say something changed. */
  upcommingRace$: Observable<Race> | undefined;

  constructor(private raceService: RaceService, liveUpdates: LiveUpdatesService) {
    this.upcommingRace$ = liveUpdates.refreshNeeded$.pipe(
      startWith(undefined),
      // a failed reload keeps what is shown; the next change reloads again
      switchMap(() => this.raceService.getUpcommingRace().pipe(catchError(() => EMPTY))),
    );
  }
}
