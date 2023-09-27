import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Show {
  id?: string;
  name: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ShowService {
  constructor(private http: HttpClient) {}

  getOldShows(): Observable<Show[]> {
    return this.http.get<Show[]>('api/show/old-shows')
  }

  getCurrentShows(): Observable<Show[]> | undefined {
    return this.http.get<Show[]>('api/show/current-shows')
  }

  getShow(showId: string): Observable<Show> {
    return this.http.get<Show>(`api/show/${showId}`);
  }

  createShow(show: Show): Observable<Show> {
    return this.http.post<Show>('api/show', show);
  }
}
