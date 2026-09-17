import { Component, forwardRef, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { AddEncoreComponent } from './add-encore.component';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import { EncoreSong, EncoreSongService } from 'projects/backend-api/src/lib/encore-song.service';

@Component({
  selector: 'lib-song-auto-complete',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => StubSongAutoCompleteComponent),
    },
  ],
})
class StubSongAutoCompleteComponent implements ControlValueAccessor {
  @Input() label: string | undefined;
  @Input() showId: string | undefined;
  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}

describe('AddEncoreComponent', () => {
  let component: AddEncoreComponent;
  let fixture: ComponentFixture<AddEncoreComponent>;
  let showService: jasmine.SpyObj<ShowService>;
  let encoreSongService: jasmine.SpyObj<EncoreSongService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    showService = jasmine.createSpyObj('ShowService', ['getShow']);
    showService.getShow.and.returnValue(of({ id: 'show-1', name: 'Test Show' } as Show));

    encoreSongService = jasmine.createSpyObj('EncoreSongService', ['createEncoreSong']);
    encoreSongService.createEncoreSong.and.returnValue(of({} as EncoreSong));

    router = jasmine.createSpyObj('Router', ['navigate']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBar.open.and.returnValue({ afterDismissed: () => of(undefined) } as never);

    await TestBed.configureTestingModule({
      declarations: [AddEncoreComponent, StubSongAutoCompleteComponent],
      imports: [CommonModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ShowService, useValue: showService },
        { provide: EncoreSongService, useValue: encoreSongService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ showId: 'show-1' }) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEncoreComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('reads the showId from the route and loads the show', () => {
    fixture.detectChanges();

    expect(component.showId).toBe('show-1');
    expect(showService.getShow).toHaveBeenCalledWith('show-1');
  });

  it('creates the encore song for this show with the selected song and navigates back on success', () => {
    fixture.detectChanges();
    const song = { id: 42, name: 'Some Song', artist: 'Some Artist' } as never;
    component.form.setValue({ song });

    component.addEncore();

    expect(encoreSongService.createEncoreSong).toHaveBeenCalledWith({ showId: 'show-1', song });
    expect(router.navigate).toHaveBeenCalledWith(['..'], { relativeTo: jasmine.anything() });
  });

  it('shows an error and re-enables the form when creation fails', () => {
    encoreSongService.createEncoreSong.and.returnValue(throwError(() => new Error('boom')) as never);
    fixture.detectChanges();

    component.addEncore();

    expect(component.createInProcess).toBe(false);
    expect(snackBar.open).toHaveBeenCalled();
  });
});
