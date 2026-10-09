import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

import { SongModule } from './song.module';
import { SongsComponent } from './songs.component';

describe('SongsComponent', () => {
  let component: SongsComponent;
  let fixture: ComponentFixture<SongsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SongModule, HttpClientTestingModule ],
      providers: [ provideRouter([]), provideNoopAnimations() ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}api/song`).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('triggers the selectability update and reloads songs when updateSelectability() is called', () => {
    component.updateSelectability();

    const updateReq = httpMock.expectOne(`${environment.apiUrl}api/song/update-selectability`);
    expect(updateReq.request.method).toBe('POST');
    updateReq.flush(null);

    httpMock.expectOne(`${environment.apiUrl}api/song`).flush([]);
  });

  it('renders an "Update Selecability" button that calls updateSelectability()', () => {
    spyOn(component, 'updateSelectability');
    const compiled = fixture.nativeElement as HTMLElement;
    const button = Array.from(compiled.querySelectorAll('button'))
      .find((btn) => btn.textContent?.includes('Update Selecability')) as HTMLButtonElement;

    expect(button).toBeTruthy();
    button.click();

    expect(component.updateSelectability).toHaveBeenCalled();
  });
});
