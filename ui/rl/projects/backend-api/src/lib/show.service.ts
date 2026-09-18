import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Show {
  id?: string;
  name: string;
  date: Date;
  duration?: number;
  active?: boolean;
  finished?: boolean;
  showState?: ShowState;
}

export enum ShowState {
  LISTED = "LISTED",
  BEFORE_SHOW = "BEFORE_SHOW",
  BEFORE_RACE = "BEFORE_RACE",
  RACE = "RACE",
  RACE_FINISHED = "RACE_FINISHED",
  PLAYING_VIDEO = "PLAYING_VIDEO",
  VIDEO_FINISHED = "VIDEO_FINISHED",
  SHOW_FINISHED = "SHOW_FINISHED",
  BEFORE_ENCORE = "BEFORE_ENCORE",
  PLAYING_ENCORE = "PLAYING_ENCORE",
  ENCORE_FINISHED = "ENCORE_FINISHED"
}

@Injectable({
  providedIn: 'root'
})
export class ShowService {
  constructor(private http: HttpClient) {}

  getAllShows(): Observable<Show[]> {
    return this.http.get<Show[]>(environment.apiUrl + 'api/show/shows')
  }

  getOldShows(): Observable<Show[]> {
    return this.http.get<Show[]>(environment.apiUrl + 'api/show/old-shows')
  }

  getCurrentShows(): Observable<Show[]> | undefined {
    return this.http.get<Show[]>(environment.apiUrl + 'api/show/current-shows')
  }

  getCurrentShow(): Observable<Show> {
    return this.http.get<Show>(environment.apiUrl + 'api/show/current-show')
  }

  getShow(showId: string): Observable<Show> {
    return this.http.get<Show>(environment.apiUrl + `api/show/${showId}`);
  }

  createShow(show: Show): Observable<Show> {
    return this.http.post<Show>(environment.apiUrl + 'api/show', show);
  }

  updateShow(show: Show): Observable<Show> {
    return this.http.patch<Show>(environment.apiUrl + `api/show/${show.id}`, show);
  }

  deleteShow(showId: string) {
    return this.http.delete<Show>(environment.apiUrl + `api/show/${showId}`);
  }
}
