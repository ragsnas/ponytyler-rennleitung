import { Component, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl } from '@angular/forms';
import { Song, SongService } from 'projects/song/src/public-api';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'lib-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnInit, ControlValueAccessor {
  songControl = new FormControl('');
  songs: Song[] = [];
  filteredOptions: Observable<Song[]> | undefined;
  selectedSong: Song | undefined = undefined;

  disabled = false;
  onChange = (value: Song) => {};
  onTouched = () => {};

  constructor(private songsService: SongService) {}

  ngOnInit(): void {
    this.songsService.getSongs().subscribe({
      next: (songs) => {
        this.songs = songs;
      },
    });
    this.filteredOptions = this.songControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
    this.songControl.valueChanges.subscribe((value) => {
      const matchingSong = this.songs.find(
        (song) => song.artist + ' - ' + song.name === value
      );
      if (matchingSong) {
        this.selectedSong = matchingSong;
        this.onChange(matchingSong);
      }
    });
  }

  writeValue(song: Song): void {
    this.selectedSong = song;
    this.songControl.patchValue(song.artist + ' - ' + song.name);
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

  markAsTouched(): void {
    this.onTouched();
}

  private _filter(value: string): Song[] {
    const filterValue = value.toLowerCase();
    return this.songs.filter(
      (song) =>
        song.name.toLowerCase().includes(filterValue) ||
        song.artist.toLowerCase().includes(filterValue)
    );
  }
}
