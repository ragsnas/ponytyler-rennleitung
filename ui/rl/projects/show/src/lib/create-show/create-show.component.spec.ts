import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of } from 'rxjs';
import { ShowService } from 'projects/backend-api/src/lib/show.service';

import { CreateShowComponent } from './create-show.component';

describe('CreateShowComponent', () => {
  let component: CreateShowComponent;
  let fixture: ComponentFixture<CreateShowComponent>;
  let createShow: jasmine.Spy;

  beforeEach(async () => {
    createShow = jasmine.createSpy('createShow').and.returnValue(of({ id: '1' }));
    await TestBed.configureTestingModule({
      declarations: [CreateShowComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ShowService, useValue: { createShow } },
        { provide: MatSnackBar, useValue: { open: () => ({ afterDismissed: () => EMPTY }) } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not collect shifts', () => {
    expect(component.form.contains('shifts')).toBeFalse();
  });

  describe('createShow', () => {
    it('sends the start time combined with the date', () => {
      component.form.patchValue({ name: 'Show', date: new Date(2026, 5, 1, 0, 0), time: '21:30', duration: '90' });

      component.createShow();

      const sent = createShow.calls.mostRecent().args[0];
      expect(sent).toEqual({ name: 'Show', date: new Date(2026, 5, 1, 21, 30), duration: 90 });
    });

    it('does not mutate the date held by the form', () => {
      const date = new Date(2026, 5, 1, 0, 0);
      component.form.patchValue({ name: 'Show', date, time: '21:30' });

      component.createShow();

      expect(component.form.getRawValue().date.getTime()).toBe(new Date(2026, 5, 1, 0, 0).getTime());
    });
  });
});
