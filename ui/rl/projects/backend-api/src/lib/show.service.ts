import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Show {
  id?: string;
  name: string;
  date: Date;
  active: boolean;
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

  getCurrentShow(): Observable<Show> | undefined {
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
}
