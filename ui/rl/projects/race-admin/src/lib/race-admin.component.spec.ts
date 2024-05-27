import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceAdminComponent } from './race-admin.component';

describe('RaceAdminComponent', () => {
  let component: RaceAdminComponent;
  let fixture: ComponentFixture<RaceAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RaceAdminComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaceAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
