import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subject, of, throwError } from 'rxjs';

import { UpcommingRacesComponent } from './upcomming-races.component';
import { Race, RaceService } from 'projects/backend-api/src/lib/race.service';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import { LiveUpdatesService } from 'projects/mqtt-broker/src/lib/live-updates.service';

describe('UpcommingRacesComponent', () => {
  let component: UpcommingRacesComponent;
  let fixture: ComponentFixture<UpcommingRacesComponent>;
  let showService: jasmine.SpyObj<ShowService>;
  let raceService: jasmine.SpyObj<RaceService>;
  let refreshNeeded$: Subject<void>;
  const liveShow: Show = { id: '7', name: 'Live', date: new Date(), active: true };
  const races = (...names: string[]) => names.map((person1, i) => ({ id: String(i), person1, person2: 'W' }) as unknown as Race);
  const rows = () => fixture.nativeElement.querySelectorAll('.person1');
  const rendered = () => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    refreshNeeded$ = new Subject<void>();
    // no getAllShows on purpose: only the current show is asked for
    showService = jasmine.createSpyObj('ShowService', ['getCurrentShow']);
    showService.getCurrentShow.and.returnValue(of(liveShow));
    raceService = jasmine.createSpyObj('RaceService', ['getUpcommingRaces']);
    raceService.getUpcommingRaces.and.returnValue(of(races('First')));

    await TestBed.configureTestingModule({
      declarations: [UpcommingRacesComponent],
      imports: [MatTableModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ShowService, useValue: showService },
        { provide: RaceService, useValue: raceService },
        { provide: LiveUpdatesService, useValue: { refreshNeeded$: refreshNeeded$.asObservable() } },
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
    expect(rendered()).toContain('First');
  });

  it('shows nothing, and loads no races, while no show is active (the backend answers 404)', () => {
    showService.getCurrentShow.and.returnValue(throwError(() => ({ status: 404 })));

    fixture.detectChanges();

    expect(raceService.getUpcommingRaces).not.toHaveBeenCalled();
    expect(rows().length).toBe(0);
    expect(rendered()).not.toContain('No Races yet');
  });

  it('shows the races of a show that became active later, when the live updates say something changed', () => {
    showService.getCurrentShow.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();
    showService.getCurrentShow.and.returnValue(of(liveShow));

    refreshNeeded$.next();
    fixture.detectChanges();

    expect(rendered()).toContain('First');
  });

  it('shows the new list when the live updates say something changed', () => {
    fixture.detectChanges();
    raceService.getUpcommingRaces.and.returnValue(of(races('Second', 'Third')));

    refreshNeeded$.next();
    fixture.detectChanges();

    expect(rendered()).not.toContain('First');
    expect(rows().length).toBe(2);
  });

  it('says so when the list becomes empty', () => {
    fixture.detectChanges();
    raceService.getUpcommingRaces.and.returnValue(of([]));

    refreshNeeded$.next();
    fixture.detectChanges();

    expect(rendered()).toContain('No Races yet');
  });

  it('clears the list when the show ends (404), and keeps it when a reload fails otherwise', () => {
    fixture.detectChanges();

    showService.getCurrentShow.and.returnValue(throwError(() => ({ status: 500 })));
    refreshNeeded$.next();
    fixture.detectChanges();
    expect(rendered()).toContain('First');

    showService.getCurrentShow.and.returnValue(throwError(() => ({ status: 404 })));
    refreshNeeded$.next();
    fixture.detectChanges();
    expect(rendered()).not.toContain('First');
  });
});
