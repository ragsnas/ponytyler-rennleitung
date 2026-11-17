import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';

import { AppComponent } from './app.component';
import { ShowService } from '../../projects/backend-api/src/lib/show.service';
import { HealthService } from '../../projects/backend-api/src/lib/health.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let showServiceSpy: jasmine.SpyObj<ShowService>;
  let healthServiceSpy: jasmine.SpyObj<HealthService>;

  beforeEach(async () => {
    // no getAllShows on purpose: the page must ask for the current show only
    showServiceSpy = jasmine.createSpyObj('ShowService', ['getCurrentShow']);
    // the backend answers 404 while no show is active
    showServiceSpy.getCurrentShow.and.returnValue(throwError(() => ({ status: 404 })));

    healthServiceSpy = jasmine.createSpyObj('HealthService', ['checkHealth']);
    healthServiceSpy.checkHealth.and.returnValue(of(new HttpResponse<{ status: string }>({ status: 200, body: { status: 'ok' } })));

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        provideRouter([]),
        { provide: ShowService, useValue: showServiceSpy },
        { provide: HealthService, useValue: healthServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
  });

  function healthWarningElement(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.backend-health-warning');
  }

  it('shows no warning while the backend reports healthy', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(healthWarningElement()).toBeNull();

    discardPeriodicTasks();
  }));

  it('shows a warning when the health check does not return 200', fakeAsync(() => {
    healthServiceSpy.checkHealth.and.returnValue(of(new HttpResponse<{ status: string }>({ status: 503, body: { status: 'error' } })));

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(healthWarningElement()).not.toBeNull();

    discardPeriodicTasks();
  }));

  it('shows a warning when the health check request errors out', fakeAsync(() => {
    healthServiceSpy.checkHealth.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(healthWarningElement()).not.toBeNull();

    discardPeriodicTasks();
  }));

  it('clears the warning again once the backend recovers', fakeAsync(() => {
    healthServiceSpy.checkHealth.and.returnValue(of(new HttpResponse<{ status: string }>({ status: 503, body: { status: 'error' } })));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(healthWarningElement()).not.toBeNull();

    healthServiceSpy.checkHealth.and.returnValue(of(new HttpResponse<{ status: string }>({ status: 200, body: { status: 'ok' } })));
    tick(5000);
    fixture.detectChanges();

    expect(healthWarningElement()).toBeNull();

    discardPeriodicTasks();
  }));

  it('polls the health check every 5 seconds', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(healthServiceSpy.checkHealth).toHaveBeenCalledTimes(1);

    tick(5000);
    expect(healthServiceSpy.checkHealth).toHaveBeenCalledTimes(2);

    tick(5000);
    expect(healthServiceSpy.checkHealth).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));

  describe('add race button', () => {
    const addRaceButton = (): HTMLButtonElement | null => fixture.nativeElement.querySelector('button[aria-label="Add Show"]');

    it('leads to the race form of the current show', fakeAsync(() => {
      showServiceSpy.getCurrentShow.and.returnValue(of({ id: '7', name: 'Live', date: new Date(), active: true }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(addRaceButton()).not.toBeNull();
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      addRaceButton()!.click();
      expect(router.serializeUrl(navigate.calls.mostRecent().args[0] as never)).toBe('/show/7/create-race');
      expect(showServiceSpy.getCurrentShow).toHaveBeenCalledTimes(1);

      discardPeriodicTasks();
    }));

    it('is not offered, and nothing fails, while no show is active', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(addRaceButton()).toBeNull();

      discardPeriodicTasks();
    }));
  });
});
