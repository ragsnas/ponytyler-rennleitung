import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Song {
  id: number
  name: string
  artist: string
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
}
