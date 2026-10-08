import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DirectorDashboardRedirectComponent } from './director-dashboard-redirect.component';

describe('DirectorDashboardRedirectComponent', () => {
  let component: DirectorDashboardRedirectComponent;
  let fixture: ComponentFixture<DirectorDashboardRedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DirectorDashboardRedirectComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorDashboardRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
