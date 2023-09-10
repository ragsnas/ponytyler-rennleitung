import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Show, ShowService } from '../show.service';

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
