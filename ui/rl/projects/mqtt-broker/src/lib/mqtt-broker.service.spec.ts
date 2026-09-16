import { MqttBrokerMessage, MqttBrokerService } from './mqtt-broker.service';

type Handler = (...args: any[]) => void;

class FakeMqttClient {
  private readonly handlers: { [event: string]: Handler[] } = {};

  on(event: string, handler: Handler): this {
    (this.handlers[event] ||= []).push(handler);
    return this;
  }

  subscribe = jasmine.createSpy('subscribe');
  end = jasmine.createSpy('end');

  emit(event: string, ...args: any[]): void {
    (this.handlers[event] || []).forEach((handler) => handler(...args));
  }
}

describe('MqttBrokerService', () => {
  let service: MqttBrokerService;
  let fakeClient: FakeMqttClient;
  let connectFn: jasmine.Spy;

  beforeEach(() => {
    fakeClient = new FakeMqttClient();
    connectFn = jasmine.createSpy('connect').and.returnValue(fakeClient as any);
    service = new MqttBrokerService(connectFn as any);
  });

  it('connects to the given broker url', () => {
    service.connect('ws://example.test/mqtt-ws');

    expect(connectFn).toHaveBeenCalledWith('ws://example.test/mqtt-ws');
  });

  it('reports connected and subscribes to every topic once the client connects', () => {
    service.connect('ws://example.test/mqtt-ws');
    let connected: boolean | undefined;
    service.connected$.subscribe((value: boolean) => (connected = value));

    fakeClient.emit('connect');

    expect(connected).toBe(true);
    expect(fakeClient.subscribe).toHaveBeenCalledWith('#');
  });

  it('reports disconnected once the client closes', () => {
    service.connect('ws://example.test/mqtt-ws');
    let connected: boolean | undefined;
    service.connected$.subscribe((value: boolean) => (connected = value));
    fakeClient.emit('connect');

    fakeClient.emit('close');

    expect(connected).toBe(false);
  });

  it('emits every received message with its topic and stringified payload', () => {
    service.connect('ws://example.test/mqtt-ws');
    const messages: MqttBrokerMessage[] = [];
    service.messages$.subscribe((message: MqttBrokerMessage) => messages.push(message));

    fakeClient.emit('message', 'Bike/1', { toString: () => '{"pulsecount":1}' });

    expect(messages.length).toBe(1);
    expect(messages[0].topic).toBe('Bike/1');
    expect(messages[0].payload).toBe('{"pulsecount":1}');
  });

  it('ends the underlying client when destroyed', () => {
    service.connect('ws://example.test/mqtt-ws');

    service.ngOnDestroy();

    expect(fakeClient.end).toHaveBeenCalledWith(true);
  });

  it('does not open a second connection when already connected', () => {
    service.connect('ws://example.test/mqtt-ws');
    service.connect('ws://example.test/mqtt-ws');

    expect(connectFn).toHaveBeenCalledTimes(1);
  });
});
