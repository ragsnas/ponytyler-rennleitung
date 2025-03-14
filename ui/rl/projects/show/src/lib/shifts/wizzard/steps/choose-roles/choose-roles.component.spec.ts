import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseRolesComponent } from './choose-roles.component';

describe('ChooseRolesComponent', () => {
  let component: ChooseRolesComponent;
  let fixture: ComponentFixture<ChooseRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseRolesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
