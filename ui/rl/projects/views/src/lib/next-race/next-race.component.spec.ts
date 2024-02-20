import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NextRaceComponent } from './next-race.component';

describe('UpcommingRaceComponent', () => {
  let component: NextRaceComponent;
  let fixture: ComponentFixture<NextRaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NextRaceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NextRaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
