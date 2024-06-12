import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export enum Origin {
  LEGACY = 'LEGACY',
  FROM_DIRECT_INPUT = 'FROM_DIRECT_INPUT',
  FROM_FILE_SYNC = 'FROM_FILE_SYNC',
  FROM_CLOUD_SYNC = 'FROM_CLOUD_SYNC',
}

export interface Song {
  id?: number
  name: string
  artist: string
  deleted: boolean
  selectable: boolean
  origin: Origin
}

@Injectable({
  providedIn: 'root'
})
export class SongService {
  songs$: Observable<Song[]> = new BehaviorSubject([]);

  constructor(private http: HttpClient) {

  }
  getSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(`${environment.apiUrl}api/song`).pipe(result => {
      return result

    });
  }

  getSong(songId: string | null): Observable<Song> {
    return this.http.get<Song>(`${environment.apiUrl}api/song/${songId}`).pipe(result => {
      return result
    });

  }

  getSelectableSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(`${environment.apiUrl}api/song/selectable`).pipe(result => {
      return result
    });

  }

  createSong(song: Song): Observable<Song> {
    return this.http.post<Song>(`${environment.apiUrl}api/song`, song);
  }

  updateSong(song: Song) {
    return this.http.patch(`${environment.apiUrl}api/song/${song.id}`, song);
  }
}
