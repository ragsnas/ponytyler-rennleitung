import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';

import { DirectorDashboardComponent } from './director-dashboard.component';
import { Race, RaceService, RaceState } from 'projects/backend-api/src/lib/race.service';
import { ShowService } from 'projects/backend-api/src/lib/show.service';
import { BikeWon } from 'projects/backend-api/src/lib/bike-won';

describe('DirectorDashboardComponent', () => {
  let component: DirectorDashboardComponent;
  let fixture: ComponentFixture<DirectorDashboardComponent>;
  let raceService: jasmine.SpyObj<RaceService>;

  const race = (id: string, overrides: Partial<Race> = {}): Race =>
    ({
      id,
      showId: '5',
      orderNumber: Number(id),
      person1: `black ${id}`,
      person2: `white ${id}`,
      song1: { artist: 'A', name: `S1 ${id}` },
      song2: { artist: 'B', name: `S2 ${id}` },
      bikeWon: BikeWon.NOT_RACED,
      raceState: RaceState.LISTED,
      ...overrides,
    }) as unknown as Race;

  let upcoming: Race[];
  let past: Race[];

  async function create() {
    await TestBed.configureTestingModule({
      declarations: [DirectorDashboardComponent],
      imports: [MatTableModule, MatIconModule, MatButtonModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ showId: '5' })) } },
        { provide: ShowService, useValue: { getShow: () => of({ id: '5', name: 'Show', date: new Date() }) } },
        { provide: RaceService, useValue: raceService },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    upcoming = [race('1')];
    past = [];
    raceService = jasmine.createSpyObj('RaceService', ['getRacesForShow', 'updateRace']);
    raceService.getRacesForShow.and.callFake((_showId: string, raced = false) => of(raced ? past : upcoming));
    raceService.updateRace.and.returnValue(of({}) as never);
  });

  const button = (label: string): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);
  const rows = (): HTMLTableRowElement[] => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
  const cells = (row: HTMLTableRowElement) => Array.from<HTMLTableCellElement>(row.querySelectorAll('td'));

  it('should create', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  describe('past races', () => {
    // [bikeWon, black rider/song/icon highlighted, white rider/song/icon highlighted]
    const cases: Array<[BikeWon, boolean, boolean]> = [
      [BikeWon.BLACK, true, false],
      [BikeWon.WHITE, false, true],
      [BikeWon.BOTH, true, true],
      [BikeWon.NOT_RACED, false, false],
    ];

    for (const [bikeWon, black, white] of cases) {
      it(`highlights ${black ? 'the black bike' : 'no black bike'} and ${white ? 'the white bike' : 'no white bike'} when bikeWon is ${bikeWon} (a number, as the backend sends it)`, async () => {
        upcoming = [];
        past = [race('1', { bikeWon, raceState: RaceState.RACED })];
        await create();

        const [, person1, song1, blackIcon, person2, song2, whiteIcon] = cells(rows()[0]);

        for (const cell of [person1, song1, blackIcon]) {
          expect(cell.classList.contains('winning-bike')).withContext('black').toBe(black);
        }
        for (const cell of [person2, song2, whiteIcon]) {
          expect(cell.classList.contains('winning-bike')).withContext('white').toBe(white);
        }
        expect(!!blackIcon.querySelector('mat-icon')).toBe(black);
        expect(!!whiteIcon.querySelector('mat-icon')).toBe(white);
      });
    }
  });

  describe('upcoming races', () => {
    it('marks black as the winner with the black bike button and white with the white one', async () => {
      await create();

      button('Mark Race as won by black Bike')!.click();
      expect(raceService.updateRace.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ id: '1', bikeWon: BikeWon.BLACK, raceState: RaceState.RACED }),
      );

      button('Mark Race as won by white Bike')!.click();
      expect(raceService.updateRace.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ id: '1', bikeWon: BikeWon.WHITE, raceState: RaceState.RACED }),
      );
    });
  });

  describe('action buttons say what they do', () => {
    it('labels the actions of an upcoming race', async () => {
      await create();

      button('Mark Race as won by both Bikes')!.click();
      expect(raceService.updateRace.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ bikeWon: BikeWon.BOTH, raceState: RaceState.RACED }),
      );

      button('Mark Race as raced')!.click();
      expect(raceService.updateRace.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ raceState: RaceState.RACED }),
      );

      expect(button('Edit Race')).not.toBeNull();
    });

    it('labels the action of a past race that was raced', async () => {
      upcoming = [];
      past = [race('1', { raceState: RaceState.RACED, bikeWon: BikeWon.BLACK })];
      await create();

      button('Mark Race as not raced')!.click();

      expect(raceService.updateRace.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ raceState: RaceState.LISTED }),
      );
    });

    it('has no leftover "Delete Song" / "Update Song" labels on race actions', async () => {
      past = [race('2', { raceState: RaceState.RACED, bikeWon: BikeWon.BLACK })];
      await create();

      expect(button('Delete Song')).toBeNull();
      expect(button('Update Song')).toBeNull();
    });
  });
});
