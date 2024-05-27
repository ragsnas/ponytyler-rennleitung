import { Component, OnInit } from '@angular/core';
import {Race, RaceService} from 'projects/backend-api/src/lib/race.service';
import {Show, ShowService} from 'projects/backend-api/src/lib/show.service';
import {filter, map, Observable} from "rxjs";

@Component({
  selector: 'lib-upcomming-races',
  templateUrl: './upcomming-races.component.html',
  styleUrls: ['./upcomming-races.component.css']
})
export class UpcommingRacesComponent implements OnInit {
  public upcommingRaces$: Observable<Race[]> | undefined;

  constructor(private showService: ShowService, private raceService: RaceService) { }

  ngOnInit(): void {
    this.showService.getAllShows().pipe(
      filter((shows: Show[]) => shows.some((show: Show) => show.active)),
      map((shows: Show[]) => shows[0])
    ).subscribe((show:Show) => {
      if (show.id) {
        this.upcommingRaces$ = this.raceService.getRacesForShow(show.id, false);
      }
    });
  }

}
