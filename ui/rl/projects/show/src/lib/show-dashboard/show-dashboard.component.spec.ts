import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { Subject, of } from 'rxjs';

import { ShowDashboardComponent } from './show-dashboard.component';
import { ShowService, ShowState } from 'projects/backend-api/src/lib/show.service';
import { Race, RaceService, RaceState } from 'projects/backend-api/src/lib/race.service';
import { StatisticsService } from 'projects/backend-api/src/lib/statistics.service';

describe('ShowDashboardComponent', () => {
  let component: ShowDashboardComponent;
  let fixture: ComponentFixture<ShowDashboardComponent>;
  let showService: jasmine.SpyObj<ShowService>;
  let raceService: jasmine.SpyObj<RaceService>;

  beforeEach(async () => {
    showService = jasmine.createSpyObj('ShowService', ['getShow', 'deleteShow', 'updateShow']);
    showService.getShow.and.returnValue(of({ id: 'show-1', name: 'Test Show', date: new Date(), duration: 60 }));
    showService.updateShow.and.returnValue(of({ id: 'show-1', name: 'Test Show', date: new Date(), duration: 60 }));

    raceService = jasmine.createSpyObj('RaceService', ['getAllRacesForShow', 'updateRace']);
    raceService.getAllRacesForShow.and.returnValue(of([]));
    raceService.updateRace.and.returnValue(of({}));

    const statisticsService = jasmine.createSpyObj('StatisticsService', ['isListFull']);
    statisticsService.isListFull.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      declarations: [ShowDashboardComponent],
      imports: [CommonModule, MatTableModule, MatButtonModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ShowService, useValue: showService },
        { provide: RaceService, useValue: raceService },
        { provide: StatisticsService, useValue: statisticsService },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ showId: 'show-1' }) },
            paramMap: of(convertToParamMap({ showId: 'show-1' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('has no lastUpdated timestamp before the first load completes', () => {
    expect(component.lastUpdated).toBeUndefined();
  });

  it('sets lastUpdated once the initial load completes', () => {
    fixture.detectChanges();

    expect(component.lastUpdated).toBeInstanceOf(Date);
  });

  it('shows the lastUpdated time in the template', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.last-updated')?.textContent).toContain('Last updated');
  });

  it('reloads the races and refreshes lastUpdated when manualRefresh is called', () => {
    fixture.detectChanges();
    raceService.getAllRacesForShow.calls.reset();

    component.manualRefresh();

    expect(raceService.getAllRacesForShow).toHaveBeenCalledTimes(1);
    expect(component.lastUpdated).toBeInstanceOf(Date);
  });

  it('marks refreshing as true while a manual refresh is in flight and false once it completes', () => {
    const racesSubject = new Subject<[]>();
    raceService.getAllRacesForShow.and.returnValue(racesSubject.asObservable() as never);
    fixture.detectChanges();

    component.manualRefresh();
    expect(component.refreshing).toBe(true);

    racesSubject.next([]);
    racesSubject.complete();
    expect(component.refreshing).toBe(false);
  });

  it('triggers manualRefresh when the manual refresh button is clicked', () => {
    fixture.detectChanges();
    spyOn(component, 'manualRefresh');

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Refresh now"]',
    );
    button?.click();

    expect(component.manualRefresh).toHaveBeenCalled();
  });

  it('disables the manual refresh button while refreshing', () => {
    const racesSubject = new Subject<[]>();
    raceService.getAllRacesForShow.and.returnValue(racesSubject.asObservable() as never);
    fixture.detectChanges();

    component.manualRefresh();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Refresh now"]',
    );
    expect(button?.disabled).toBe(true);
  });

  it('marks the race as WAITING_TO_RACE and the show as BEFORE_RACE when startRace is called', () => {
    fixture.detectChanges();

    const race: Race = { id: 'race-1', showId: 'show-1', person1: 'A', person2: 'B', orderNumber: '0', bikeWon: 0, raceState: RaceState.LISTED };
    component.startRace(race);

    expect(raceService.updateRace).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'race-1', raceState: RaceState.WAITING_TO_RACE }));
    expect(showService.updateShow).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'show-1', showState: ShowState.BEFORE_RACE }));
  });

  it('reloads the races once startRace completes', () => {
    fixture.detectChanges();
    raceService.getAllRacesForShow.calls.reset();

    component.startRace({ id: 'race-1', showId: 'show-1', person1: 'A', person2: 'B', orderNumber: '0', bikeWon: 0, raceState: RaceState.LISTED });

    expect(raceService.getAllRacesForShow).toHaveBeenCalledTimes(1);
  });

  it('shows a "Start Race" button for a race that is waiting to be raced', () => {
    raceService.getAllRacesForShow.and.returnValue(of([
      { id: 'race-1', showId: 'show-1', person1: 'A', person2: 'B', orderNumber: '0', bikeWon: 0, raceState: RaceState.LISTED },
    ]));
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Start Race"]',
    );
    expect(button).toBeTruthy();
  });

  it('calls startRace when the "Start Race" button is clicked', () => {
    raceService.getAllRacesForShow.and.returnValue(of([
      { id: 'race-1', showId: 'show-1', person1: 'A', person2: 'B', orderNumber: '0', bikeWon: 0, raceState: RaceState.LISTED },
    ]));
    fixture.detectChanges();
    spyOn(component, 'startRace');

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Start Race"]',
    );
    button?.click();

    expect(component.startRace).toHaveBeenCalled();
  });
});
