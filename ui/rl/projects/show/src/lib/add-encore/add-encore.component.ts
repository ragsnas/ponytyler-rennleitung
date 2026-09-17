import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Song } from 'projects/song/src/public-api';
import { EncoreSongService } from 'projects/backend-api/src/lib/encore-song.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-add-encore',
  templateUrl: './add-encore.component.html',
  styleUrls: ['./add-encore.component.scss'],
})
export class AddEncoreComponent implements OnInit {

  public form: FormGroup = new FormGroup({
    song: new FormControl<Song | undefined>(undefined),
  });
  showId: string | undefined;
  show$: Observable<Show> | undefined;
  createInProcess: boolean = false;

  constructor(
    private showService: ShowService,
    private encoreSongService: EncoreSongService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.showId = this.route.snapshot.paramMap.get('showId') || undefined;
    if (this.showId) {
      this.show$ = this.showService.getShow(this.showId);
    }
  }

  addEncore() {
    this.createInProcess = true;
    const { song } = this.form.getRawValue();
    this.encoreSongService.createEncoreSong({
      showId: this.showId as string,
      song,
    }).subscribe({
      next: () => {
        this.snackBar.open(`Successfully added Encore Song`, 'OK', { duration: 200, panelClass: 'success' })
          .afterDismissed()
          .subscribe(() => {
            this.router.navigate(['..'], { relativeTo: this.route });
          });
      },
      error: (error) => {
        this.createInProcess = false;
        this.snackBar.open(`Error during Encore Song Creation: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        });
      }
    });
  }

}
