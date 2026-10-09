import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { Origin, Song, SongService } from 'projects/backend-api/src/lib/song.service';
import { SongModule } from '../song.module';
import { DuplicatesComponent, SongWithDuplicateMeta } from './duplicates.component';

const song = (id: number, artist: string, name: string): Song => ({
  id, artist, name, deleted: false, selectable: true, origin: Origin.FROM_FILE_SYNC,
});

describe('DuplicatesComponent', () => {
  let component: DuplicatesComponent;
  let fixture: ComponentFixture<DuplicatesComponent>;
  let getSelectableSongs: jasmine.Spy;
  let shown: SongWithDuplicateMeta[] | undefined;

  beforeEach(async () => {
    localStorage.removeItem('pontyTyperLevenshteinDistanceMinimum');
    getSelectableSongs = jasmine.createSpy('getSelectableSongs').and.returnValue(of([
      song(1, 'Queen', 'Bohemian Rhapsody'),
      song(2, 'Queen', 'Bohemian Rhapsody '),
      song(3, 'ABBA', 'Waterloo'),
    ]));
    await TestBed.configureTestingModule({
      imports: [SongModule],
      providers: [
        provideRouter([]), provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(),
        { provide: SongService, useValue: { getSelectableSongs, updateSong: () => of({}) } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuplicatesComponent);
    component = fixture.componentInstance;
    shown = undefined;
    component.songs$.subscribe(songs => shown = songs);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem('pontyTyperLevenshteinDistanceMinimum'));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches the songs once on init', () => {
    expect(getSelectableSongs).toHaveBeenCalledTimes(1);
    expect(shown?.length).toBe(1);
  });

  it('does not refetch or recompute on every slider tick, and debounces the filter', fakeAsync(() => {
    component.levenshteinDistanceMinimumFormControl.setValue('7');
    component.levenshteinDistanceMinimumFormControl.setValue('8');
    component.levenshteinDistanceMinimumFormControl.setValue('0');

    expect(component.levenshteinDistanceMinimum).toBe(0);
    expect(shown?.length).toBe(1); // not yet filtered

    tick(300);

    expect(shown).toEqual([]);
    expect(getSelectableSongs).toHaveBeenCalledTimes(1);
  }));

  it('persists the chosen distance', fakeAsync(() => {
    component.levenshteinDistanceMinimumFormControl.setValue('9');
    tick(300);

    expect(localStorage.getItem('pontyTyperLevenshteinDistanceMinimum')).toBe('9');
  }));
});
