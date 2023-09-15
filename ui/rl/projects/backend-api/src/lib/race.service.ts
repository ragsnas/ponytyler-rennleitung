import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Race {
  id?: string;
  createdAt?: Date | string;
  showId: string;
  person1: string;
  song1Id?: string;
  person2: string;
  song2Id?: string;
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
    this.http.post('api/race', race).subscribe({
      next: (result) => {
        console.log(`It worked:`, result);
        
      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      }
    });
  }
}
