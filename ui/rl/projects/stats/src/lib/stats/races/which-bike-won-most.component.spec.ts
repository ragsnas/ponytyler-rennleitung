import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { StatisticsService } from 'projects/backend-api/src/lib/statistics.service';

import { WhichBikeWonMostComponent } from './which-bike-won-most.component';

describe('WhichBikeWonMostComponent', () => {
  let component: WhichBikeWonMostComponent;
  let fixture: ComponentFixture<WhichBikeWonMostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WhichBikeWonMostComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        {
          provide: StatisticsService,
          useValue: {
            whichBikeWonMost: () => of([
              { bikeWon: 1, timesWon: 5 },
              { bikeWon: 2, timesWon: 4 },
              { bikeWon: 3, timesWon: 3 },
              { bikeWon: 0, timesWon: 2 },
            ]),
          },
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhichBikeWonMostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels bike 1 as the black and bike 2 as the white bike, like the dashboards do', async () => {
    const rows = await firstValueFrom(component.whichBikeWonMostComponent$!);

    expect(rows).toEqual([
      { bikeWon: 'Black Bike Won', timesWon: 5 },
      { bikeWon: 'White Bike Won', timesWon: 4 },
      { bikeWon: 'Both Songs Played', timesWon: 3 },
      { bikeWon: 'Not Raced', timesWon: 2 },
    ]);
  });
});
