import { TestBed } from '@angular/core/testing';

import { StateMachineService } from './state-machine.service';

describe('StateMachineService', () => {
  let service: StateMachineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateMachineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
