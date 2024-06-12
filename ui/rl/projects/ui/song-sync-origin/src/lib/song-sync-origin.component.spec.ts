import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongSyncOriginComponent } from './song-sync-origin.component';

describe('SongSyncOriginComponent', () => {
  let component: SongSyncOriginComponent;
  let fixture: ComponentFixture<SongSyncOriginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SongSyncOriginComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongSyncOriginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
