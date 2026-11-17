import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Show, ShowService} from "projects/backend-api/src/lib/show.service";
import {HealthService} from "projects/backend-api/src/lib/health.service";
import {catchError, EMPTY, map, Observable, of, switchMap, timer} from "rxjs";

const HEALTH_CHECK_INTERVAL_MS = 5000;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit {
  public currentShow$: Observable<Show> | undefined;
  public backendUnhealthy$: Observable<boolean> | undefined;

  constructor(private showService: ShowService, private healthService: HealthService) {
  }

  ngOnInit(): void {
    console.log(`Main ngOnInit!`);
    // the backend answers 404 while no show is active: then there is no current show
    this.currentShow$ = this.showService.getCurrentShow().pipe(
      catchError(() => EMPTY)
    );
    this.backendUnhealthy$ = timer(0, HEALTH_CHECK_INTERVAL_MS).pipe(
      switchMap(() => this.healthService.checkHealth().pipe(
        map((response) => response.status !== 200),
        catchError(() => of(true))
      ))
    );
    console.info("Welcome to RL Version 1.0.0");
  }

}
