import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

import { RaceService } from './race.service';

describe('RaceService', () => {
  let service: RaceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts a race action and returns the race and the show as the backend has them now', () => {
    const result = { race: { id: 3, raceState: 'RACING' }, show: { id: 1, showState: 'RACE' } };
    let received: unknown;

    service.transition('3', 'start').subscribe((r) => (received = r));

    const req = httpMock.expectOne(`${environment.apiUrl}api/race/3/transition`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ action: 'start' });
    req.flush(result);
    expect(received).toEqual(result);
  });
});
