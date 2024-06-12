import {Component, OnInit} from '@angular/core';
import {Song, SongService} from '../../public-api';
import {Observable, of, Subject} from 'rxjs';
import {distance, closest} from 'fastest-levenshtein';
import {MatLegacySnackBar as MatSnackBar} from "@angular/material/legacy-snack-bar";
import {ActivatedRoute, Router} from "@angular/router";
import {FormControl} from "@angular/forms";
import {MatLegacySelectionListChange as MatSelectionListChange} from "@angular/material/legacy-list";
import {MatLegacySelectChange as MatSelectChange} from "@angular/material/legacy-select";

export interface SongWithDuplicateMeta extends Song {
  duplicate: Song
  distance: number
}

const PONTY_TYPER_REFRESH_TIMER_INTERVAL = 'pontyTyperLevenshteinDistanceMinimum';

@Component({
  selector: 'lib-song-duplicates',
  templateUrl: './duplicates.component.html',
  styleUrls: ['./duplicates.component.css'],
})
export class DuplicatesComponent implements OnInit {
  songs$: Subject<SongWithDuplicateMeta[]> = new Subject<SongWithDuplicateMeta[]>();

  levenshteinDistanceMinimumFormControl: FormControl<string> = new FormControl<string>(localStorage.getItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL) || '6', {nonNullable: true});
  levenshteinDistanceMinimum: number = 0;

  constructor(private songService: SongService, private snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.levenshteinDistanceMinimum = Number(localStorage.getItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL)) || 6;
    this.loadSongs();
    this.levenshteinDistanceMinimumFormControl.valueChanges.subscribe((newDistance: string) => {
        console.log(`\nchange made`, newDistance);
        localStorage.setItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL, newDistance);
        this.levenshteinDistanceMinimum = Number(newDistance);
        this.loadSongs();
    });
  }

  loadSongs() {
    this.songService.getSelectableSongs().subscribe({
      next: (songs) => {
        const songsWithDuplicateMeta: SongWithDuplicateMeta[] = []
        songs.forEach((song: Song) => {
          const otherSongs = songs
            .filter((filteredSong: Song) => song.id !== filteredSong.id);
          const songsAsFullTitle = otherSongs
            .map((filteredSong: Song) => `${filteredSong.artist} - ${filteredSong.name}`);
          const closestSongFullTitle = closest(`${song.artist} - ${song.name}`, songsAsFullTitle);
          const levDistance = distance(`${song.artist} - ${song.name}`, closestSongFullTitle);
          console.log(`\nthis.levenshteinDistanceMinimum is `, this.levenshteinDistanceMinimum);
          if (
            levDistance <= this.levenshteinDistanceMinimum
            && !songsWithDuplicateMeta.some((recognizedDuplicate: SongWithDuplicateMeta) =>
              recognizedDuplicate.duplicate.id === song.id)) {
            const closestSong = otherSongs.find((otherSong: Song) => `${otherSong.artist} - ${otherSong.name}` === closestSongFullTitle);
            songsWithDuplicateMeta.push({
              ...song,
              distance: levDistance,
              duplicate: closestSong
            } as SongWithDuplicateMeta);
          }
        });
        this.songs$.next(songsWithDuplicateMeta);
      },
      error: (error) => {
        console.log(`error:`, error);
      },
    });
  }

  mergeSingleSong(song: SongWithDuplicateMeta) {
    this.songService.updateSong({
      ...song.duplicate,
      selectable: false
    }).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully deactivated Duplicate`, 'OK', {duration: 500, panelClass: 'success'})
          .afterDismissed()
          .subscribe(() => {
            this.loadSongs();
          });
      },
      error: (error) => {
        this.snackBar.open(`Error during Update Of Show: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        });
      },
    });
  }

}
