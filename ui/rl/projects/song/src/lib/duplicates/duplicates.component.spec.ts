import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SongModule } from '../song.module';
import { DuplicatesComponent } from './duplicates.component';

describe('DuplicatesComponent', () => {
  let component: DuplicatesComponent;
  let fixture: ComponentFixture<DuplicatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SongModule, HttpClientTestingModule ],
      providers: [ provideRouter([]), provideNoopAnimations() ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuplicatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
