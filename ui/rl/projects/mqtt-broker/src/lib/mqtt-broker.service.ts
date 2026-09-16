import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import mqtt, { MqttClient } from 'mqtt';
import { Observable, Subject } from 'rxjs';

export interface MqttBrokerMessage {
  topic: string;
  payload: string;
  receivedAt: Date;
}

/**
 * Seam for tests: mqtt's browser bundle exposes a frozen ES module
 * namespace, so `mqtt.connect` can't be spied on directly. Real code gets
 * `mqtt.connect` via this token's default factory; tests override it with a
 * stub.
 */
export const MQTT_CONNECT = new InjectionToken<typeof mqtt.connect>('MQTT_CONNECT', {
  factory: () => mqtt.connect,
});

/**
 * Connects to the MQTT broker embedded in the backend over WebSocket (a
 * browser can't open the raw TCP socket it also listens on, see
 * be/src/mqtt/README.md) and republishes every message it receives,
 * regardless of topic, as an observable.
 */
@Injectable()
export class MqttBrokerService implements OnDestroy {
  private client: MqttClient | undefined;

  private readonly connectedSubject = new Subject<boolean>();
  private readonly messagesSubject = new Subject<MqttBrokerMessage>();

  readonly connected$: Observable<boolean> = this.connectedSubject.asObservable();
  readonly messages$: Observable<MqttBrokerMessage> = this.messagesSubject.asObservable();

  constructor(@Inject(MQTT_CONNECT) private readonly connectFn: typeof mqtt.connect) {}

  connect(url: string): void {
    if (this.client) {
      return;
    }

    this.client = this.connectFn(url);
    this.client.on('connect', () => {
      this.connectedSubject.next(true);
      this.client!.subscribe('#');
    });
    this.client.on('close', () => this.connectedSubject.next(false));
    this.client.on('message', (topic: string, payload: { toString(): string }) => {
      this.messagesSubject.next({ topic, payload: payload.toString(), receivedAt: new Date() });
    });
  }

  ngOnDestroy(): void {
    this.client?.end(true);
    this.client = undefined;
  }
}
