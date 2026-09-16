import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MqttBrokerMessage, MqttBrokerService } from './mqtt-broker.service';

const MAX_DISPLAYED_MESSAGES = 200;

@Component({
  selector: 'lib-mqtt-broker',
  templateUrl: './mqtt-broker.component.html',
  styleUrls: ['./mqtt-broker.component.scss'],
  providers: [MqttBrokerService],
})
export class MqttBrokerComponent implements OnInit, OnDestroy {
  connected = false;
  messages: MqttBrokerMessage[] = [];

  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly mqttBrokerService: MqttBrokerService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.mqttBrokerService.connected$.subscribe((connected) => (this.connected = connected)),
      this.mqttBrokerService.messages$.subscribe((message) => {
        this.messages = [message, ...this.messages].slice(0, MAX_DISPLAYED_MESSAGES);
      }),
    );

    this.mqttBrokerService.connect(MqttBrokerComponent.brokerUrl());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private static brokerUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/mqtt-ws`;
  }
}
