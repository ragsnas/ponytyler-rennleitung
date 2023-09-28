import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
    return this.http.get<Show[]>(environment.apiUrl + 'api/show/old-shows')
  }

  getCurrentShows(): Observable<Show[]> | undefined {
    return this.http.get<Show[]>(environment.apiUrl + 'api/show/current-shows')
  }

  getShow(showId: string): Observable<Show> {
    return this.http.get<Show>(environment.apiUrl + `api/show/${showId}`);
  }

  createShow(show: Show): Observable<Show> {
    return this.http.post<Show>(environment.apiUrl + 'api/show', show);
  }
}
