import { Component, DestroyRef, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SongService } from "projects/backend-api/src/lib/song.service";
import { Subject, debounceTime } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { FormControl } from "@angular/forms";
import { filterDuplicates, findNearestNeighbours, SongNeighbour, SongWithDuplicateMeta } from "./duplicates.util";

export type { SongWithDuplicateMeta } from "./duplicates.util";

const PONTY_TYPER_REFRESH_TIMER_INTERVAL = 'pontyTyperLevenshteinDistanceMinimum';
const FILTER_DEBOUNCE_MS = 200;

@Component({
    selector: 'lib-song-duplicates',
    templateUrl: './duplicates.component.html',
    styleUrls: ['./duplicates.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DuplicatesComponent implements OnInit {
  songs$: Subject<SongWithDuplicateMeta[]> = new Subject<SongWithDuplicateMeta[]>();

  levenshteinDistanceMinimumFormControl: FormControl<string> = new FormControl<string>(localStorage.getItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL) || '6', {nonNullable: true});
  levenshteinDistanceMinimum: number = 0;

  private neighbours: SongNeighbour[] = [];
  private readonly destroyRef = inject(DestroyRef);

  constructor(private songService: SongService, private snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.levenshteinDistanceMinimum = Number(localStorage.getItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL)) || 6;
    this.loadSongs();

    // The chip follows the slider immediately; the (cheap) filtering is debounced.
    this.levenshteinDistanceMinimumFormControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newDistance: string) => {
        this.levenshteinDistanceMinimum = Number(newDistance);
      });
    this.levenshteinDistanceMinimumFormControl.valueChanges
      .pipe(debounceTime(FILTER_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe((newDistance: string) => {
        localStorage.setItem(PONTY_TYPER_REFRESH_TIMER_INTERVAL, newDistance);
        this.publishDuplicates();
      });
  }

  /** Fetches the songs and computes the nearest neighbours once; the slider only re-filters. */
  loadSongs() {
    this.songService.getSelectableSongs().subscribe({
      next: (songs) => {
        this.neighbours = findNearestNeighbours(songs);
        this.publishDuplicates();
      },
      error: (error) => {
        console.log(`error:`, error);
      },
    });
  }

  private publishDuplicates() {
    this.songs$.next(filterDuplicates(this.neighbours, this.levenshteinDistanceMinimum));
  }

  mergeSingleSong(song: SongWithDuplicateMeta) {
    this.songService.updateSong({
      ...song.duplicate,
      selectable: false
    }).subscribe({
      next: () => {
        this.snackBar.open(`Successfully deactivated Duplicate`, 'OK', {duration: 250, panelClass: 'success'})
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
