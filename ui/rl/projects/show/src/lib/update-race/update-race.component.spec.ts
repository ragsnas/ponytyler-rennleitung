import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of, throwError } from 'rxjs';
import { RaceService } from 'projects/backend-api/src/lib/race.service';
import { ShowService } from 'projects/backend-api/src/lib/show.service';
import { StubSongAutoCompleteComponent } from '../testing/stub-song-auto-complete.component';

import { UpdateRaceComponent } from './update-race.component';

describe('UpdateRaceComponent', () => {
  let component: UpdateRaceComponent;
  let fixture: ComponentFixture<UpdateRaceComponent>;
  let updateRace: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    updateRace = jasmine.createSpy('updateRace').and.returnValue(of({}));
    await TestBed.configureTestingModule({
      declarations: [UpdateRaceComponent, StubSongAutoCompleteComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: RaceService, useValue: { getRace: () => of({ id: 5, person1: 'a', person2: 'b' }), updateRace } },
        { provide: ShowService, useValue: { getShow: () => EMPTY } },
        { provide: MatSnackBar, useValue: { open: () => ({ afterDismissed: () => EMPTY }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ showId: '3', raceId: '5' }) } } },
      ]
    })
    .compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(UpdateRaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates right away on success, without waiting for the snackbar to be dismissed', () => {
    component.updateRace();

    expect(navigate).toHaveBeenCalledOnceWith(['../..'], { relativeTo: jasmine.anything() });
  });

  it('stays on the page when saving fails', () => {
    updateRace.and.returnValue(throwError(() => new Error('boom')));

    component.updateRace();

    expect(navigate).not.toHaveBeenCalled();
  });
});
