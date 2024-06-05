import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditShowComponent } from './edit-show.component';

describe('CreateShowComponent', () => {
  let component: EditShowComponent;
  let fixture: ComponentFixture<EditShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditShowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
