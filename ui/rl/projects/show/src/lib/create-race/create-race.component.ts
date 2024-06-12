import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Song, SongService} from 'projects/song/src/public-api';
import {Race, RaceService, RaceState} from 'projects/backend-api/src/lib/race.service';
import {StatisticsService} from 'projects/backend-api/src/lib/statistics.service';
import {MatLegacySnackBar as MatSnackBar} from "@angular/material/legacy-snack-bar";
import {Show, ShowService} from 'projects/backend-api/src/lib/show.service';
import {combineLatest, filter, map, Observable} from 'rxjs';

@Component({
  selector: 'lib-create-race',
  templateUrl: './create-race.component.html',
  styleUrls: ['./create-race.component.scss']
})
export class CreateRaceComponent implements OnInit {

  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    person1: new FormControl(''),
    song1: new FormControl<Song | undefined>(undefined),
    person2: new FormControl(''),
    song2: new FormControl<Song | undefined>(undefined),
    orderNumber: new FormControl(''),
  });
  showId: string | undefined;
  show$: Observable<Show> | undefined;
  createInProcess: boolean = false;
  listIsFull: boolean = false;
  averageRacesPerHour: number | undefined;

  constructor(
    private showService: ShowService,
    private raceService: RaceService,
    private statisticsService: StatisticsService,
    private songService: SongService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.showId = this.route.snapshot.paramMap.get('showId') || undefined;
    if (this.showId) {
      this.show$ = this.showService.getShow(this.showId);
      this.statisticsService.isListFull(this.showId).subscribe((listIsFull) => {
        this.listIsFull = listIsFull;
      });
    }
  }

  createRace() {
    this.createInProcess = true;
    const race = this.form.getRawValue();
    const raceState = race.person1 && race.person2 && race.song1Id && race.song2Id ? RaceState.WAITING_TO_RACE : RaceState.WAITING_FOR_OPPONENT;
    this.raceService.createRace({
      ...race,
      raceState,
      showId: this.route.snapshot.paramMap.get('showId')
    }).subscribe({
      next: (result) => {
        let snackBarMessage = `Successfully Created Race between ${race.person1} and ${race.person2}`;
        if (raceState === RaceState.WAITING_FOR_OPPONENT) {
          snackBarMessage = `Successfully Created Race for Waiting List`;
        }
        this.snackBar.open(snackBarMessage, 'OK', {duration: 400, panelClass: 'success'})
          .afterDismissed()
          .subscribe(() => {
            this.router.navigate(['..'], {relativeTo: this.route});
          });
      },
      error: (error) => {
        this.createInProcess = false;
        this.snackBar.open(`Error during Race Creation: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        })
      }
    });
  }

}
