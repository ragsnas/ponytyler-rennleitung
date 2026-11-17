import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { Race, RaceService } from "projects/backend-api/src/lib/race.service";
import { Show, ShowService } from "projects/backend-api/src/lib/show.service";
import { catchError, EMPTY, Observable } from "rxjs";

@Component({
    selector: 'lib-upcomming-races',
    templateUrl: './upcomming-races.component.html',
    styleUrls: ['./upcomming-races.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UpcommingRacesComponent implements OnInit {
  public upcommingRaces$: Observable<Race[]> | undefined;

  constructor(private showService: ShowService, private raceService: RaceService) { }

  ngOnInit(): void {
    // the backend answers 404 while no show is active: then there is nothing to list
    this.showService.getCurrentShow().pipe(
      catchError(() => EMPTY)
    ).subscribe((show: Show) => {
      if (show.id) {
        this.upcommingRaces$ = this.raceService.getUpcommingRaces();
      }
    });
  }

}
