import { Component, Input, OnInit, forwardRef } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { Race, RaceService } from 'projects/backend-api/src/lib/race.service';
import { Song, SongService } from 'projects/song/src/public-api';
import { Observable, combineLatest, filter, map, startWith } from 'rxjs';

export interface SongWithRaceInfo extends Song {
  alreadyPlayed: boolean;
  alreadyWished: boolean;
}

@Component({
  selector: 'lib-song-auto-complete',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InputComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => InputComponent),
    },
  ],
})
export class InputComponent implements OnInit, ControlValueAccessor, Validator {
  @Input()
  label: string | undefined;

  @Input()
  showId: string | undefined;

  songControl = new FormControl('');
  songs: SongWithRaceInfo[] = [];
  filteredOptions: Observable<SongWithRaceInfo[]> | undefined;
  selectedSong: Song | undefined = undefined;

  disabled = false;
  onChange = (value: Song) => {};
  onTouched = () => {};
  onValidatorChange = () => {};

  constructor(private songsService: SongService, private raceService: RaceService) {}

  ngOnInit(): void {
    combineLatest([
      this.songsService.getSelectableSongs(),
      this.raceService.getRacesForShow(this.showId || '', true),
      this.raceService.getRacesForShow(this.showId || '', false)
    ]).pipe(
      map(([songs, racesFinished, racesUpcoming]: [Song[], Race[], Race[]]) => {
        const songIdsAlreadyPlayed = racesFinished.map(race => {
          const result = [];
          if (race.bikeWon === 1) {
            return race.song1Id;
          }
          if (race.bikeWon === 2) {
            return race.song2Id;
          }
          return [race.song1Id, race.song2Id];
        }).flat();
        const songIdsAlreadyWished = racesUpcoming.map(race => [race.song1Id, race.song2Id]).flat();
        return songs.map(song => ({
          ...song,
          alreadyPlayed: songIdsAlreadyPlayed.some(songId => song.id === songId),
          alreadyWished: songIdsAlreadyWished.some(songId => song.id === songId),
        } as SongWithRaceInfo));
      })
    )
    .subscribe({
      next: (songs: SongWithRaceInfo[]) => {
        this.songs = songs;
      },
    });
    this.filteredOptions = this.songControl.valueChanges.pipe(
      startWith(''),
      filter(value => typeof value !== "object"),
      map((value) => this._filter(value || ''))
    );
    this.songControl.valueChanges.subscribe((value) => {
      console.log(`valueChanges detects:`, value);  
      if((value as unknown as Song).name) {
        const song = (value as unknown as Song);
        this.songControl.patchValue(song.artist + ' - ' + song.name);

      }

      const matchingSong = this.songs.find(
        (song) => song.artist + ' - ' + song.name === value
      );
      if (matchingSong) {
        console.log(`matching song found:`, matchingSong);
        const { alreadyPlayed, alreadyWished, ...selectedSong } = matchingSong;
        this.selectedSong = selectedSong as Song;
        this.onChange(selectedSong);
      }
    });
  }

  writeValue(song: Song): void {
    console.log(`write value called with`, song);
    this.selectedSong = song;
    if (song) {
      this.songControl.patchValue(song.artist + ' - ' + song.name);
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  validate(control: AbstractControl): ValidationErrors | null {
    return null;
  }
  markAsTouched(): void {
    this.onTouched();
  }

  private _filter(value: string): SongWithRaceInfo[] {
    console.log(`_filter value:`, value);
    const filterValue = (value || '').toLowerCase();
    return this.songs.filter(
      (song) =>
        song.name.toLowerCase().includes(filterValue) ||
        song.artist.toLowerCase().includes(filterValue)
    );
  }
}
