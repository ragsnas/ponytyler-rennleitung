import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Race, RaceService } from 'projects/backend-api/src/lib/race.service';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'lib-show-dashboard',
  templateUrl: './show-dashboard.component.html',
  styleUrls: ['./show-dashboard.component.scss'],
})
export class ShowDashboardComponent implements OnInit {
  show: Show | undefined;
  races$: BehaviorSubject<Race[]> = new BehaviorSubject<Race[]>([]);
  finishedRaces$: BehaviorSubject<Race[]> = new BehaviorSubject<Race[]>([]);

  constructor(
    private showService: ShowService,
    private raceService: RaceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadRaces();
  }
  loadRaces() {
    this.route.paramMap.subscribe((params) => {
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
    });

  }

  markRaceAsRaced(race: Race): void {
    console.log(`markRaceAsRaced with race > race.raced`, race.raced);
    console.log(`markRaceAsRaced with after race.raced`, {...race, raced: race.raced}.raced);
    
    this.raceService
      .updateRace({
        ...race,
        raced: true,
      } as Race)
      .subscribe({
        next: (result) => {
          console.log(`It worked:`, result);
          this.loadRaces();
        },
        error: (error) => {
          console.error(`Oh No! It didn't work!:`, error);
        },
      });
  }

  markRaceAsNotRaced(race: Race): void {
    this.raceService
      .updateRace({ ...race, raced: false } as Race)
      .subscribe({
        next: (result) => {
          console.log(`It worked:`, result);
          this.loadRaces();
        },
        error: (error) => {
          console.error(`Oh No! It didn't work!:`, error);
        },
      });
  }
}
