import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { WhichBikeWonMostComponent } from './which-bike-won-most.component';

describe('SongsComponent', () => {
  let component: WhichBikeWonMostComponent;
  let fixture: ComponentFixture<WhichBikeWonMostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WhichBikeWonMostComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhichBikeWonMostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
