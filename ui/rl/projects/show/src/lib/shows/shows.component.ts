import {Component, OnInit} from '@angular/core';
import {Show, ShowService} from 'projects/backend-api/src/lib/show.service';
import {Observable} from 'rxjs';
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'lib-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.css']
})
export class ShowsComponent implements OnInit {

  shows$: Observable<Show[]> | undefined;

  constructor(private showService: ShowService, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.shows$ = this.showService.getAllShows();
  }

  toggleActive(show: Show) {
    this.showService.updateShow({
      ...show,
      active: !show.active
    }).subscribe({
      next: (result) => {
        console.log(`this worked`);
        this.shows$ = this.showService.getAllShows();
      },
      error: (error) => {
        this.snackBar.open(`Error during toggling of Show Status: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, announcementMessage: `Error`, panelClass: 'error'
        });
      }
    });
  }

}
