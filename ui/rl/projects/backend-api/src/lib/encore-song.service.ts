import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Song } from './song.service';
import { environment } from 'src/environments/environment';

export interface EncoreSong {
  id?: number;
  showId: string;
  song?: Song;
  order?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EncoreSongService {
  constructor(private http: HttpClient) {}

  getEncoreSongsForShow(showId: string): Observable<EncoreSong[]> {
    return this.http.get<EncoreSong[]>(
      `${environment.apiUrl}api/encore-song/for-show/${showId}`
    );
  }

  createEncoreSong(encoreSong: EncoreSong): Observable<EncoreSong> {
    return this.http.post<EncoreSong>(`${environment.apiUrl}api/encore-song`, {
      showId: encoreSong.showId,
      songId: encoreSong.song?.id,
    });
  }
}
