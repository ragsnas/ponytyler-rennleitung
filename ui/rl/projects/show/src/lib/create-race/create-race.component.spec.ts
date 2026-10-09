import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of } from 'rxjs';
import { RaceService, RaceState } from 'projects/backend-api/src/lib/race.service';
import { Origin, Song } from 'projects/backend-api/src/lib/song.service';
import { ShowService } from 'projects/backend-api/src/lib/show.service';
import { StatisticsService } from 'projects/backend-api/src/lib/statistics.service';
import { StubSongAutoCompleteComponent } from '../testing/stub-song-auto-complete.component';

import { CreateRaceComponent } from './create-race.component';

describe('CreateRaceComponent', () => {
  let component: CreateRaceComponent;
  let fixture: ComponentFixture<CreateRaceComponent>;
  let createRace: jasmine.Spy;

  beforeEach(async () => {
    createRace = jasmine.createSpy('createRace').and.returnValue(of({}));
    await TestBed.configureTestingModule({
      declarations: [CreateRaceComponent, StubSongAutoCompleteComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: RaceService, useValue: { createRace } },
        { provide: ShowService, useValue: { getShow: () => EMPTY } },
        { provide: StatisticsService, useValue: { isListFull: () => of(false) } },
        { provide: MatSnackBar, useValue: { open: () => ({ afterDismissed: () => EMPTY }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ showId: '3' }) } } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateRaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('createRace', () => {
    const song = (id: number): Song => ({ id, name: `song ${id}`, artist: 'artist', deleted: false, selectable: true, origin: Origin.FROM_DIRECT_INPUT });

    it('creates a LISTED race when both riders and both songs are chosen', () => {
      component.form.patchValue({ person1: 'a', person2: 'b', song1: song(1), song2: song(2) });

      component.createRace();

      expect(createRace.calls.mostRecent().args[0].raceState).toBe(RaceState.LISTED);
    });

    it('waits for an opponent when the second song is missing', () => {
      component.form.patchValue({ person1: 'a', person2: 'b', song1: song(1) });

      component.createRace();

      expect(createRace.calls.mostRecent().args[0].raceState).toBe(RaceState.WAITING_FOR_OPPONENT);
    });
  });
});
