import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { UpcommingRacesComponent } from './upcomming-races.component';
import { Race, RaceService } from 'projects/backend-api/src/lib/race.service';
import { ShowService } from 'projects/backend-api/src/lib/show.service';

describe('UpcommingRacesComponent', () => {
  let component: UpcommingRacesComponent;
  let fixture: ComponentFixture<UpcommingRacesComponent>;
  let showService: jasmine.SpyObj<ShowService>;
  let raceService: jasmine.SpyObj<RaceService>;
  const races = [{ id: '1', person1: 'A', person2: 'B' }] as Race[];

  beforeEach(async () => {
    // no getAllShows on purpose: only the current show is asked for
    showService = jasmine.createSpyObj('ShowService', ['getCurrentShow']);
    showService.getCurrentShow.and.returnValue(of({ id: '7', name: 'Live', date: new Date(), active: true }));
    raceService = jasmine.createSpyObj('RaceService', ['getUpcommingRaces']);
    raceService.getUpcommingRaces.and.returnValue(of(races));

    await TestBed.configureTestingModule({
      declarations: [UpcommingRacesComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ShowService, useValue: showService },
        { provide: RaceService, useValue: raceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcommingRacesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads the upcoming races when a show is active', () => {
    fixture.detectChanges();

    expect(showService.getCurrentShow).toHaveBeenCalledTimes(1);
    expect(raceService.getUpcommingRaces).toHaveBeenCalledTimes(1);
    expect(component.upcommingRaces$).toBeDefined();
  });

  it('shows nothing, and loads no races, while no show is active (the backend answers 404)', () => {
    showService.getCurrentShow.and.returnValue(throwError(() => ({ status: 404 })));

    fixture.detectChanges();

    expect(raceService.getUpcommingRaces).not.toHaveBeenCalled();
    expect(component.upcommingRaces$).toBeUndefined();
  });
});
