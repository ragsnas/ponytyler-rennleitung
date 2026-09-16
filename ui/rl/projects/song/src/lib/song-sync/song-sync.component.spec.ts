import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonListModule } from 'projects/ui/button-list/src/public-api';

import { SongSyncComponent } from './song-sync.component';

describe('SongSyncComponent', () => {
  let component: SongSyncComponent;
  let fixture: ComponentFixture<SongSyncComponent>;
  let httpMock: HttpTestingController;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatIconModule,
        MatListModule,
        MatProgressSpinnerModule,
        ButtonListModule,
      ],
      declarations: [SongSyncComponent],
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SongSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('triggers the cloud sync endpoint when the sync button is used', () => {
    component.syncWithCloud();

    const req = httpMock.expectOne('api/song/cloud-sync');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('marks the sync as in progress until the request completes', () => {
    component.syncWithCloud();
    expect(component.syncingWithCloud).toBe(true);

    const req = httpMock.expectOne('api/song/cloud-sync');
    req.flush(null);

    expect(component.syncingWithCloud).toBe(false);
  });

  it('shows a success toast once the cloud sync finishes', () => {
    component.syncWithCloud();

    const req = httpMock.expectOne('api/song/cloud-sync');
    req.flush(null);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Cloud Song Sync finished.',
      'OK',
      jasmine.objectContaining({ panelClass: 'success' }),
    );
  });

  it('shows a toast explaining that a sync is already running on a 409 conflict', () => {
    component.syncWithCloud();

    const req = httpMock.expectOne('api/song/cloud-sync');
    req.flush(
      { message: 'Song Sync is already running.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(component.syncingWithCloud).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Cloud Song Sync is already running. Please wait for it to finish.',
      'OK',
      jasmine.objectContaining({ panelClass: 'error' }),
    );
  });

  it('shows a generic error toast for any other failure', () => {
    component.syncWithCloud();

    const req = httpMock.expectOne('api/song/cloud-sync');
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.syncingWithCloud).toBe(false);
    const [message, action, options] = snackBar.open.calls.mostRecent().args as [
      string,
      string,
      { panelClass: string },
    ];
    expect(message).toContain('Error during Cloud Song Sync');
    expect(action).toBe('OK');
    expect(options.panelClass).toBe('error');
  });

  it('does not start a second request while one is already in flight', () => {
    component.syncWithCloud();
    component.syncWithCloud();

    const req = httpMock.expectOne('api/song/cloud-sync');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
