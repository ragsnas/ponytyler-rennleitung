import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongSyncComponent } from './duplicates.component';

describe('SongSyncComponent', () => {
  let component: SongSyncComponent;
  let fixture: ComponentFixture<SongSyncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SongSyncComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
