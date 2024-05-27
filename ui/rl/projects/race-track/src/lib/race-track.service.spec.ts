import { TestBed } from '@angular/core/testing';

import { RaceTrackService } from './race-track.service';

describe('RaceTrackService', () => {
  let service: RaceTrackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RaceTrackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
