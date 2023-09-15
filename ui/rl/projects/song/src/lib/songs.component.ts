import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Song, SongService } from '../../../backend-api/src/lib/song.service';

@Component({
  selector: 'lib-song-songs',
  templateUrl: './songs.component.html',
  styleUrls: ['./songs.component.scss']
})
export class SongsComponent implements OnInit {
  songs$: BehaviorSubject<Song[]> = new BehaviorSubject<Song[]>([]);

  constructor(private songService: SongService) { }


  ngOnInit(): void {
    this.loadSongs();
  }

  deleteSong(song: Song) {
    this.songService.updateSong({...song, deleted: true}).subscribe({
      next: result => {
        this.loadSongs();
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
      }
    });
  }

  blockSong(song: Song) {
    this.songService.updateSong({...song, selectable: false}).subscribe({
      next: result => {
        this.loadSongs();
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
      }
    });
  }

  unblockSong(song: Song) {
    this.songService.updateSong({...song, selectable: true}).subscribe({
      next: result => {
        this.loadSongs();
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
      }
    });
  }

  loadSongs() {
    this.songService.getSongs().subscribe({
      next: result => {
        this.songs$.next(result);
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
        
      }
    })   
  }

}
