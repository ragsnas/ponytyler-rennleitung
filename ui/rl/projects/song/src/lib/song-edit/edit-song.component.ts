import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Origin, Song, SongService} from '../../public-api';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'lib-song-edit',
  templateUrl: './edit-song.component.html',
  styleUrls: ['./edit-song.component.scss']
})
export class EditSongComponent {

  public form: FormGroup = new FormGroup({
    name: new FormControl<string>(''),
    artist: new FormControl<string>(''),
    deleted: new FormControl<boolean>(false),
    selectable: new FormControl<boolean>(true),
    origin: new FormControl<Origin>(Origin.LEGACY),
  });
  private song: Song | undefined;

  constructor(
    private songService: SongService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    const songId = this.route.snapshot.paramMap.get('songId');
    this.songService.getSong(songId).subscribe((song: Song) => {
      console.log(`\ngot song:`, song);
      this.song = song;
      this.form.patchValue(song);
    });
  }

  editSong() {
    this.songService.updateSong(
      {
        ...this.song as Song,
        ...this.form.getRawValue() as Song
      } as Song
    ).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully Updated Song`, 'OK', {panelClass: 'success'})
          .afterDismissed()
          .subscribe(() => {
            this.router.navigate(['..'], {relativeTo: this.route});
          });
      },
      error: (error) => {
        this.snackBar.open(`Error during Update Of Song: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        });
      }
    });;
  }


}
