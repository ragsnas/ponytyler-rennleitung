import { Component, OnInit } from '@angular/core';
import { Song, SongService } from './song.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'lib-song-songs',
  templateUrl: './songs.component.html',
  styleUrls: ['./songs.component.scss']
})
export class SongsComponent implements OnInit {
  songs$: Observable<Song[]> = new BehaviorSubject([]);

  constructor(private songService: SongService) { }

  ngOnInit(): void {
    this.songService.getSongs().subscribe({
      next: result => {
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
        
      }
    })
  }

}
