import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Race, RaceService } from 'projects/backend-api/src/lib/race.service';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import { BehaviorSubject } from 'rxjs';
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'lib-show-director-dashboard',
  templateUrl: './director-dashboard.component.html',
  styleUrls: ['./director-dashboard.component.scss'],
})
export class DirectorDashboardComponent implements OnInit {
  show: Show | undefined;
  races$: BehaviorSubject<Race[]> = new BehaviorSubject<Race[]>([]);
  finishedRaces$: BehaviorSubject<Race[]> = new BehaviorSubject<Race[]>([]);

  constructor(
    private showService: ShowService,
    private raceService: RaceService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRaces();
  }
  loadRaces() {
    this.route.paramMap.subscribe({next: (params) => {
        if (params.get('showId')) {
          const showId = params.get('showId') as string;
          this.showService
            .getShow(showId)
            .subscribe((show) => (this.show = show));
          this.raceService.getRacesForShow(showId).subscribe((races) => {
            this.races$.next(races);
          });
          this.raceService.getRacesForShow(showId, true).subscribe((races) => {
            this.finishedRaces$.next(races);
          });
        }
      },
      error: (error) => {
        this.snackBar.open(`Error during loading of Races: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, announcementMessage: `Error`, panelClass: 'error'
        });
      },
    });

  }

  bikeWon(bike: number, race: Race) {
    this.raceService
      .updateRace({
        ...race,
        bikeWon: bike,
        raced: true,
      } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as "Bike ${bike} won!" Congrats ${bike === 1 ? race.person1 : race.person2}`, 'OK', {panelClass: 'success', duration: 250});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, announcementMessage: `Error`, panelClass: 'error'
          });
        },
      });
  }

  markRaceAsPlayBoth(race: Race): void {
    this.raceService
      .updateRace({
        ...race,
        raced: true,
        bikeWon: 3
      } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as "Both Won"`, 'OK', {panelClass: 'success', duration: 250});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during Marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
  }

  markRaceAsRaced(race: Race): void {
    this.raceService
      .updateRace({
        ...race,
        raced: true,
      } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as over`, 'OK', {panelClass: 'success', duration: 250});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during Marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
  }

  markRaceAsNotRaced(race: Race): void {
    this.raceService
      .updateRace({ ...race, raced: false } as Race)
      .subscribe({
        next: (result) => {
          this.snackBar.open(`Marked Race as NOT over`, 'OK', {panelClass: 'success', duration: 250});
          this.loadRaces();
        },
        error: (error) => {
          this.snackBar.open(`Error during Marking of the Race: ${JSON.stringify(error)}`, 'OK', {
            duration: 10000, panelClass: 'error'
          });
        },
      });
  }
}
