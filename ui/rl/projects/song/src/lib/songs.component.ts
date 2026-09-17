import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  startWith,
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Song, SongService } from '../../../backend-api/src/lib/song.service';

@Component({
  selector: 'lib-song-songs',
  templateUrl: './songs.component.html',
  styleUrls: ['./songs.component.scss'],
})
export class SongsComponent implements OnInit {
  songs$: BehaviorSubject<Song[]> = new BehaviorSubject<Song[]>([]);
  filteredSongs$: Observable<Song[]> | undefined;
  filter = new FormControl<string>('');
  filterForm = new FormGroup({ filter: this.filter });
  updatingSelectability = false;

  constructor(
    private songService: SongService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSongs();
    this.filter.valueChanges
      .pipe(startWith(''))
      .subscribe((valueChange) =>
        console.log(`filter valueChange`, valueChange)
      );
    this.filteredSongs$ = combineLatest([
      this.songs$,
      this.filter.valueChanges.pipe(
        startWith(''),
        map((valueChange) => (valueChange ? valueChange.toLowerCase() : ''))
      ),
    ]).pipe(
      map(([songs, searchString]: [Song[], string]) => {
        const filteredSongs = songs.filter(
          (song) =>
            song.artist.toLowerCase().indexOf(searchString) >= 0 ||
            song.name.toLowerCase().indexOf(searchString) >= 0
        );
        console.log(
          `filteredSongs for searchString ${searchString}:`,
          filteredSongs
        );
        return filteredSongs;
      })
    );
  }

  deleteSong(song: Song) {
    this.songService.updateSong({ ...song, deleted: true }).subscribe({
      next: (result) => {
        this.loadSongs();
        console.log(`Result:`, result);
      },
      error: (error) => {
        console.log(`error:`, error);
      },
    });
  }

  blockSong(song: Song) {
    this.songService.updateSong({ ...song, selectable: false }).subscribe({
      next: (result) => {
        this.loadSongs();
        console.log(`Result:`, result);
      },
      error: (error) => {
        console.log(`error:`, error);
      },
    });
  }

  unblockSong(song: Song) {
    this.songService.updateSong({ ...song, selectable: true }).subscribe({
      next: (result) => {
        this.loadSongs();
        console.log(`Result:`, result);
      },
      error: (error) => {
        console.log(`error:`, error);
      },
    });
  }

  updateSelectability() {
    if (this.updatingSelectability) {
      return;
    }
    this.updatingSelectability = true;
    this.songService.updateSelectability().subscribe({
      next: () => {
        this.updatingSelectability = false;
        this.loadSongs();
        this.snackBar.open('Selectability updated.', 'OK', { panelClass: 'success' });
      },
      error: (error: HttpErrorResponse) => {
        this.updatingSelectability = false;
        this.snackBar.open(`Error updating selectability: ${JSON.stringify(error.message)}`, 'OK', {
          duration: 10000, panelClass: 'error',
        });
      },
    });
  }

  loadSongs() {
    this.songService.getSongs().subscribe({
      next: (result) => {
        this.songs$.next(result);
        console.log(`Result:`, result);
      },
      error: (error) => {
        console.log(`error:`, error);
      },
    });
  }
}
