import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Song } from './song.service';

export interface Race {
  id?: string;
  createdAt?: Date | string;
  showId: string;
  person1: string;
  song1Id?: string;
  song1?: Song;
  person2: string;
  song2Id?: string;
  song2?: Song;
  orderNumber: string;
  raced?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RaceService {
  constructor(private http: HttpClient) {}

  getRacesForShow(showId: string): Observable<Race[]> {
    return this.http.get<Race[]>('api/race/for-show/' + showId)
  }

  createRace(race: Race) {
    return this.http.post('api/race', {
      showId: race.showId,
      person1: race.person1,
      song1Id: race.song1!.id,
      person2: race.person2,
      song2Id: race.song2!.id
        });
  }

  updateRace(race: Race) {
    return this.http.patch(`api/race/${race.id}`, {
      ...race
    });
  }


}
