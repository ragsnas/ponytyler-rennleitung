import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SongService } from '../../public-api';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-song-input',
  templateUrl: './create-song.component.html',
  styleUrls: ['./create-song.component.scss']
})
export class CreateSongComponent {
  
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    artist: new FormControl(''),
    deleted: new FormControl(false),
    selectable: new FormControl(true),
  });
  
  constructor(private songService: SongService, private router: Router) { }

  createSong() {
    this.songService.createSong(this.form.getRawValue()).subscribe({
      next: (result) => {
        console.log(`It worked:`, result);
        this.router.navigate(['song']);

      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      }
    });;
  }


}
