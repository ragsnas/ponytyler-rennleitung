import { ApplicationRef, ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';

import CountdownComponent from './countdown.component';

@Component({
  selector: 'lib-countdown-host',
  template: '<lib-countdown [countDownFrom]="3"></lib-countdown>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
class OnPushHostComponent {}

describe('CountdownComponent', () => {
  let component: CountdownComponent;
  let fixture: ComponentFixture<CountdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CountdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('CountdownComponent inside an OnPush parent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [CountdownComponent, OnPushHostComponent] }).compileComponents();
  });

  it('keeps rendering the countdown inside an OnPush parent', fakeAsync(() => {
    const hostFixture = TestBed.createComponent(OnPushHostComponent);
    hostFixture.autoDetectChanges(true);
    const appRef = TestBed.inject(ApplicationRef);
    const text = () => (hostFixture.nativeElement as HTMLElement).textContent?.trim();
    tick();
    expect(text()).toBe('3');

    tick(1000);
    appRef.tick();

    expect(text()).toBe('2');

    discardPeriodicTasks();
  }));
});
