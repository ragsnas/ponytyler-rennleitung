import {Component, OnInit} from '@angular/core';
import {Show, ShowService} from "projects/backend-api/src/lib/show.service";
import {HealthService} from "projects/backend-api/src/lib/health.service";
import {catchError, filter, map, Observable, of, switchMap, timer} from "rxjs";

const HEALTH_CHECK_INTERVAL_MS = 5000;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public currentShow$: Observable<Show> | undefined;
  public backendUnhealthy$: Observable<boolean> | undefined;

  constructor(private showService: ShowService, private healthService: HealthService) {
  }

  ngOnInit(): void {
    this.currentShow$ = this.showService.getAllShows().pipe(
      filter((shows: Show[]) => shows.some((show: Show) => show.active)),
      map((shows: Show[]) => shows[0])
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
