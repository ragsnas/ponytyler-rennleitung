import * as i0 from "@angular/core";
import { InjectionToken, OnDestroy, OnInit } from "@angular/core";
import mqtt from "mqtt";
import { Observable } from "rxjs";
import * as i2 from "@angular/common";
import * as i3 from "@angular/router";
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
export declare const MQTT_CONNECT: InjectionToken<typeof mqtt.connect>;
/**
 * Connects to the MQTT broker embedded in the backend over WebSocket (a
 * browser can't open the raw TCP socket it also listens on, see
 * be/src/mqtt/README.md) and republishes every message it receives,
 * regardless of topic, as an observable.
 */
export declare class MqttBrokerService implements OnDestroy {
  private readonly connectFn;
  private client;
  private readonly connectedSubject;
  private readonly messagesSubject;
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<MqttBrokerMessage>;
  constructor(connectFn: typeof mqtt.connect);
  connect(url: string): void;
  ngOnDestroy(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<MqttBrokerService, never>;
  static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
declare namespace mqtt_broker_component_d_exports {
  export { MqttBrokerComponent };
}
export declare class MqttBrokerComponent implements OnInit, OnDestroy {
  private readonly mqttBrokerService;
  connected: boolean;
  messages: MqttBrokerMessage[];
  private readonly subscriptions;
  constructor(mqttBrokerService: MqttBrokerService);
  ngOnInit(): void;
  ngOnDestroy(): void;
  private static brokerUrl;
  static ɵfac: i0.ɵɵFactoryDeclaration<MqttBrokerComponent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<MqttBrokerComponent, "lib-mqtt-broker", never, {}, {}, never, never, false, never>;
}
export declare class MqttBrokerModule {
  static ɵfac: i0.ɵɵFactoryDeclaration<MqttBrokerModule, never>;
  static ɵmod: i0.ɵɵNgModuleDeclaration<MqttBrokerModule, [typeof MqttBrokerComponent], [typeof i2.CommonModule, typeof i3.RouterModule], [typeof MqttBrokerComponent]>;
  static ɵinj: i0.ɵɵInjectorDeclaration<MqttBrokerModule>;
}