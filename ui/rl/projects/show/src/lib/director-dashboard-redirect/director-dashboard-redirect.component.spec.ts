import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorDashboardRedirectComponent } from './director-dashboard-redirect.component';

describe('DirectorDashboardRedirectComponent', () => {
  let component: DirectorDashboardRedirectComponent;
  let fixture: ComponentFixture<DirectorDashboardRedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectorDashboardRedirectComponent ]
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
