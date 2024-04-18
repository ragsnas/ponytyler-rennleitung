import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Song, SongService} from 'projects/song/src/public-api';
import {Race, RaceService} from '../../../../backend-api/src/lib/race.service';
import {MatSnackBar} from "@angular/material/snack-bar";
import {Observable, Subject} from 'rxjs';
import {Show, ShowService } from 'projects/backend-api/src/lib/show.service';

@Component({
  selector: 'lib-create-race',
  templateUrl: './update-race.component.html',
  styleUrls: ['./update-race.component.css']
})
export class UpdateRaceComponent implements OnInit {

  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    person1: new FormControl('', [Validators.required]),
    song1: new FormControl<Song|undefined>(undefined, [Validators.required]),
    person2: new FormControl('', [Validators.required]),
    song2: new FormControl<Song|undefined>(undefined, [Validators.required]),
    orderNumber: new FormControl(''),
  });
  showId: string | undefined;
  show$: Observable<Show> | undefined;
  raceId: string | undefined;
  race: Race | undefined;

  constructor(
    private showService: ShowService,
    private raceService: RaceService,
    private songService: SongService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.showId = this.route.snapshot.paramMap.get('showId') || undefined;
    if (this.showId) {
      this.show$ = this.showService.getShow(this.showId);
    }
    this.raceId = this.route.snapshot.paramMap.get('raceId') || undefined;
    this.raceService.getRace(this.raceId).subscribe({ next: (race: Race) => {
      this.race = race;
      console.log(`Race received:`, race);
      this.form.patchValue(race);
    },
      error: (error) => {
        this.snackBar.open(`Error during loading of the Race: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, announcementMessage: `Error`, panelClass: 'error'
        });
      }
    });
  }

  updateRace() {
    const updatedRace = this.form.getRawValue();
    this.raceService.updateRace({
      ...this.race,
      song1Id: updatedRace.song1.id || updatedRace.song1Id,
      song2Id: updatedRace.song2.id || updatedRace.song2Id,
      ...this.form.getRawValue()
    }).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully Updated the Race`, 'OK', {panelClass: 'success'})
          .afterDismissed()
          .subscribe(() => {
          this.router.navigate(['../..'], {relativeTo: this.route});
        });
      },
      error: (error) => {
        this.snackBar.open(`Error during update: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        });
      }
    });
  }

}
