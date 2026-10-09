import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of } from 'rxjs';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';

import { EditShowComponent } from './edit-show.component';

describe('EditShowComponent', () => {
  let component: EditShowComponent;
  let fixture: ComponentFixture<EditShowComponent>;
  let updateShow: jasmine.Spy;
  let existingShow: Show;

  beforeEach(async () => {
    existingShow = { id: '7', name: 'Old', date: new Date(2026, 5, 1, 20, 0), duration: 120, active: false, finished: true };
    updateShow = jasmine.createSpy('updateShow').and.returnValue(of(existingShow));
    await TestBed.configureTestingModule({
      declarations: [EditShowComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ShowService, useValue: { getShow: () => of(existingShow), updateShow } },
        { provide: MatSnackBar, useValue: { open: () => ({ afterDismissed: () => EMPTY }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ showId: '7' }) } } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps a finished, inactive show inactive when saving', () => {
    component.updateShow();

    const sent = updateShow.calls.mostRecent().args[0];
    expect(sent.active).toBeFalse();
    expect(sent.finished).toBeTrue();
  });

  it('keeps an active show active when saving', () => {
    existingShow.active = true;
    existingShow.finished = false;
    component.ngOnInit();

    component.updateShow();

    expect(updateShow.calls.mostRecent().args[0].active).toBeTrue();
  });
});
