import { TestBed } from '@angular/core/testing';

import { RaceAdminService } from './race-admin.service';

describe('RaceAdminService', () => {
  let service: RaceAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RaceAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
