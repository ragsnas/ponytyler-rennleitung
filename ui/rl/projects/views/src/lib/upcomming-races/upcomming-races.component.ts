import { Component, ChangeDetectionStrategy } from "@angular/core";
import { Race, RaceService } from "projects/backend-api/src/lib/race.service";
import { ShowService } from "projects/backend-api/src/lib/show.service";
import { LiveUpdatesService } from "projects/mqtt-broker/src/lib/live-updates.service";
import { catchError, EMPTY, Observable, of, startWith, switchMap } from "rxjs";

@Component({
    selector: 'lib-upcomming-races',
    templateUrl: './upcomming-races.component.html',
    styleUrls: ['./upcomming-races.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UpcommingRacesComponent {
  /**
   * The upcoming races of the current show, now and again whenever the live
   * updates say something changed; `null` while no show is active.
   */
  public upcommingRaces$: Observable<Race[] | null>;

  constructor(private showService: ShowService, private raceService: RaceService, liveUpdates: LiveUpdatesService) {
    this.upcommingRaces$ = liveUpdates.refreshNeeded$.pipe(
      startWith(undefined),
      switchMap(() => this.showService.getCurrentShow().pipe(
        switchMap((show) => show.id ? this.raceService.getUpcommingRaces() : of(null)),
        // the backend answers 404 while no show is active; any other failure keeps what is shown
        catchError((error) => error?.status === 404 ? of(null) : EMPTY),
      )),
    );
  }

}
