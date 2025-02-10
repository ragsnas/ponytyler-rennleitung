import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseShiftsComponent } from './choose-shifts.component';

describe('ChooseShiftsComponent', () => {
  let component: ChooseShiftsComponent;
  let fixture: ComponentFixture<ChooseShiftsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseShiftsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseShiftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
