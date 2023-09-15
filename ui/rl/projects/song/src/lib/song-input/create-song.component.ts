import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SongService } from '../../public-api';

@Component({
  selector: 'lib-song-input',
  templateUrl: './create-song.component.html',
  styleUrls: ['./create-song.component.scss']
})
export class CreateSongComponent {
  
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    artist: new FormControl(''),
  });
  
  constructor(private songService: SongService) { }

  createSong() {
    this.songService.createSong(this.form.getRawValue());
  }


}
