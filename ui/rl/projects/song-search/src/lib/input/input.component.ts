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
import { Song, SongService } from 'projects/song/src/public-api';
import { Observable, map, startWith } from 'rxjs';

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

  songControl = new FormControl('');
  songs: Song[] = [];
  filteredOptions: Observable<Song[]> | undefined;
  selectedSong: Song | undefined = undefined;

  disabled = false;
  onChange = (value: Song) => {};
  onTouched = () => {};
  onValidatorChange = () => {};

  constructor(private songsService: SongService) {}

  ngOnInit(): void {
    this.songsService.getSelectableSongs().subscribe({
      next: (songs) => {
        this.songs = songs;
      },
    });
    this.filteredOptions = this.songControl.valueChanges.pipe(
      startWith(''),
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
        this.selectedSong = matchingSong;
        this.onChange(matchingSong);
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

  private _filter(value: string): Song[] {
    const filterValue = value.toLowerCase() || '';
    return this.songs.filter(
      (song) =>
        song.name.toLowerCase().includes(filterValue) ||
        song.artist.toLowerCase().includes(filterValue)
    );
  }
}
