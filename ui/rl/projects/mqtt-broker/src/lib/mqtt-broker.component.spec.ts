import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MqttBrokerComponent } from './mqtt-broker.component';
import { MqttBrokerMessage, MqttBrokerService } from './mqtt-broker.service';

describe('MqttBrokerComponent', () => {
  let component: MqttBrokerComponent;
  let fixture: ComponentFixture<MqttBrokerComponent>;
  let connected$: Subject<boolean>;
  let messages$: Subject<MqttBrokerMessage>;
  let fakeService: jasmine.SpyObj<MqttBrokerService>;

  beforeEach(async () => {
    connected$ = new Subject<boolean>();
    messages$ = new Subject<MqttBrokerMessage>();
    fakeService = jasmine.createSpyObj('MqttBrokerService', ['connect'], {
      connected$,
      messages$,
    });

    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [MqttBrokerComponent],
    })
      .overrideComponent(MqttBrokerComponent, {
        set: { providers: [{ provide: MqttBrokerService, useValue: fakeService }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MqttBrokerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('connects to the broker on init', () => {
    expect(fakeService.connect).toHaveBeenCalled();
  });

  it('shows "Disconnected" until the broker reports connected', () => {
    expect(fixture.nativeElement.textContent).toContain('Disconnected');
  });

  it('shows "Connected" once the broker reports connected', () => {
    connected$.next(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Connected');
  });

  it('shows a placeholder when no messages have arrived yet', () => {
    expect(fixture.nativeElement.textContent).toContain('No messages received yet');
  });

  it('lists newly received messages, most recent first', () => {
    messages$.next({ topic: 'Bike/1', payload: '{"pulsecount":1}', receivedAt: new Date() });
    fixture.detectChanges();
    messages$.next({ topic: 'Bike/2', payload: '{"pulsecount":2}', receivedAt: new Date() });
    fixture.detectChanges();

    const items: HTMLLIElement[] = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Bike/2');
    expect(items[1].textContent).toContain('Bike/1');
  });
});
