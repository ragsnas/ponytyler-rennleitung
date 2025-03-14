import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftsDashboardComponent } from './shifts-dashboard.component';

describe('DashboardComponent', () => {
  let component: ShiftsDashboardComponent;
  let fixture: ComponentFixture<ShiftsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
