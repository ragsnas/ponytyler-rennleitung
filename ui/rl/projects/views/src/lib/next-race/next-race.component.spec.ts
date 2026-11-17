import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { NextRaceComponent } from './next-race.component';
import { Race, RaceService } from 'projects/backend-api/src/lib/race.service';
import { LiveUpdatesService } from 'projects/mqtt-broker/src/lib/live-updates.service';

describe('NextRaceComponent', () => {
  let fixture: ComponentFixture<NextRaceComponent>;
  let raceService: jasmine.SpyObj<RaceService>;
  let refreshNeeded$: Subject<void>;

  const race = (person1: string): Race =>
    ({ id: '1', person1, person2: 'White', song1: { artist: 'A', name: 'S1' }, song2: { artist: 'B', name: 'S2' } }) as unknown as Race;
  const text = () => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    refreshNeeded$ = new Subject<void>();
    raceService = jasmine.createSpyObj('RaceService', ['getUpcommingRace']);
    raceService.getUpcommingRace.and.returnValue(of(race('First Rider')));

    await TestBed.configureTestingModule({
      declarations: [NextRaceComponent],
      providers: [
        { provide: RaceService, useValue: raceService },
        { provide: LiveUpdatesService, useValue: { refreshNeeded$: refreshNeeded$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NextRaceComponent);
  });

  it('shows the upcoming race', () => {
    fixture.detectChanges();

    expect(text()).toContain('First Rider');
    expect(raceService.getUpcommingRace).toHaveBeenCalledTimes(1);
  });

  it('shows the new upcoming race when the live updates say something changed', () => {
    fixture.detectChanges();
    raceService.getUpcommingRace.and.returnValue(of(race('Second Rider')));

    refreshNeeded$.next();
    fixture.detectChanges();

    expect(text()).toContain('Second Rider');
    expect(text()).not.toContain('First Rider');
    expect(raceService.getUpcommingRace).toHaveBeenCalledTimes(2);
  });

  it('shows no race once there is none any more', () => {
    fixture.detectChanges();
    raceService.getUpcommingRace.and.returnValue(of(null as unknown as Race));

    refreshNeeded$.next();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.upcomming-race')).toBeNull();
  });

  it('keeps showing the last race when a reload fails, and recovers on the next one', () => {
    fixture.detectChanges();
    raceService.getUpcommingRace.and.returnValue(throwError(() => ({ status: 500 })));

    refreshNeeded$.next();
    fixture.detectChanges();
    expect(text()).toContain('First Rider');

    raceService.getUpcommingRace.and.returnValue(of(race('Third Rider')));
    refreshNeeded$.next();
    fixture.detectChanges();

    expect(text()).toContain('Third Rider');
  });
});
