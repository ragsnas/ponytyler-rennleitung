import {Component, OnInit} from '@angular/core';
import {Show, ShowService} from "projects/backend-api/src/lib/show.service";
import {filter, map, Observable} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public currentShow$: Observable<Show> | undefined;

  constructor(private showService: ShowService) {
  }

  ngOnInit(): void {
    this.currentShow$ = this.showService.getAllShows().pipe(
      filter((shows: Show[]) => shows.some((show: Show) => show.active)),
      map((shows: Show[]) => shows[0])
    );
    console.info("Welcome to RL Version 1.0.0");
  }

}
