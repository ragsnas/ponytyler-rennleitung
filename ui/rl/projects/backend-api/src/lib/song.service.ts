import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Song {
  id: number
  name: string
  artist: string
  deleted: boolean,
  selectable: boolean
}

@Injectable({
  providedIn: 'root'
})
export class SongService {
  songs$: Observable<Song[]> = new BehaviorSubject([]);
  
  constructor(private http: HttpClient) {
    
  }
  getSongs(): Observable<Song[]> {
    return this.http.get<Song[]>('api/song').pipe(result => {
      return result
    });
    
  }
  
  createSong(song: Song): void {
    this.http.post('api/song', song).subscribe({
      next: (result) => {
        console.log(`It worked:`, result);        
      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      }
    });
    
  }

  updateSong(song: Song) {
    return this.http.patch(`api/song/${song.id}`, song);
  }
}
