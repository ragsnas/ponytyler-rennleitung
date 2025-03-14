import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseUsersComponent } from './choose-users.component';

describe('ChooseUsersComponent', () => {
  let component: ChooseUsersComponent;
  let fixture: ComponentFixture<ChooseUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
