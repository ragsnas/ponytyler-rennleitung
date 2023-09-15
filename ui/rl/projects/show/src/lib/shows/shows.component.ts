import { Component, OnInit } from '@angular/core';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.css']
})
export class ShowsComponent implements OnInit {

  oldShows$: Observable<Show[]> | undefined;
  currentShows$:  Observable<Show[]> | undefined;

  constructor(private showService: ShowService) { }

  ngOnInit(): void {
    this.oldShows$ = this.showService.getOldShows();
    this.currentShows$ = this.showService.getCurrentShows();
  }

}
