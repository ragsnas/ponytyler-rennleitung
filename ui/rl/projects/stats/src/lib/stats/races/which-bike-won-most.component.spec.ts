import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhichBikeWonMostComponent } from './which-bike-won-most.component';

describe('SongsComponent', () => {
  let component: WhichBikeWonMostComponent;
  let fixture: ComponentFixture<WhichBikeWonMostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhichBikeWonMostComponent]
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
