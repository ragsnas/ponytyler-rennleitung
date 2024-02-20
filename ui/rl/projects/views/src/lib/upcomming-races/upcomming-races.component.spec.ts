import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcommingRacesComponent } from './upcomming-races.component';

describe('UpcommingRacesComponent', () => {
  let component: UpcommingRacesComponent;
  let fixture: ComponentFixture<UpcommingRacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpcommingRacesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcommingRacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
