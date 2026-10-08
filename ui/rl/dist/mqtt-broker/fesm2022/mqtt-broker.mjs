import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, Inject, Injectable, InjectionToken, NgModule } from "@angular/core";
import mqtt from "mqtt";
import { Subject } from "rxjs";
import { CommonModule } from "@angular/common";
import * as i1 from "@angular/router";
import { RouterModule } from "@angular/router";
const MQTT_CONNECT = new InjectionToken("MQTT_CONNECT", { factory: () => mqtt.connect });
var MqttBrokerService = class MqttBrokerService {
	connectFn;
	client;
	connectedSubject = new Subject();
	messagesSubject = new Subject();
	connected$ = this.connectedSubject.asObservable();
	messages$ = this.messagesSubject.asObservable();
	constructor(connectFn) {
		this.connectFn = connectFn;
	}
	connect(url) {
		if (this.client) return;
		this.client = this.connectFn(url);
		this.client.on("connect", () => {
			this.connectedSubject.next(true);
			this.client.subscribe("#");
		});
		this.client.on("close", () => this.connectedSubject.next(false));
		this.client.on("message", (topic, payload) => {
			this.messagesSubject.next({
				topic,
				payload: payload.toString(),
				receivedAt: /* @__PURE__ */ new Date()
			});
		});
	}
	ngOnDestroy() {
		this.client?.end(true);
		this.client = void 0;
	}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MqttBrokerService,
		deps: [{ token: MQTT_CONNECT }],
		target: i0.ɵɵFactoryTarget.Injectable
	});
	static ɵprov = i0.ɵɵngDeclareInjectable({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MqttBrokerService
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: MqttBrokerService,
	decorators: [{ type: Injectable }],
	ctorParameters: () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [MQTT_CONNECT]
		}]
	}]
});
const MAX_DISPLAYED_MESSAGES = 200;
var MqttBrokerComponent = class MqttBrokerComponent {
	mqttBrokerService;
	connected = false;
	messages = [];
	subscriptions = [];
	constructor(mqttBrokerService) {
		this.mqttBrokerService = mqttBrokerService;
	}
	ngOnInit() {
		this.subscriptions.push(this.mqttBrokerService.connected$.subscribe((connected) => this.connected = connected), this.mqttBrokerService.messages$.subscribe((message) => {
			this.messages = [message, ...this.messages].slice(0, MAX_DISPLAYED_MESSAGES);
		}));
		this.mqttBrokerService.connect(MqttBrokerComponent.brokerUrl());
	}
	ngOnDestroy() {
		this.subscriptions.forEach((subscription) => subscription.unsubscribe());
	}
	static brokerUrl() {
		return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/mqtt-ws`;
	}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MqttBrokerComponent,
		deps: [{ token: MqttBrokerService }],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "17.0.0",
		version: "22.2.1",
		type: MqttBrokerComponent,
		isStandalone: false,
		selector: "lib-mqtt-broker",
		providers: [MqttBrokerService],
		ngImport: i0,
		template: "<h2>MQTT Broker</h2>\n\n<p class=\"connection-status\">Status: {{ connected ? 'Connected' : 'Disconnected' }}</p>\n\n@if (messages.length > 0) {\n  <ul class=\"messages\">\n    @for (message of messages; track message) {\n      <li>\n        <span class=\"topic\">{{ message.topic }}</span>: <span class=\"payload\">{{ message.payload }}</span>\n      </li>\n    }\n  </ul>\n} @else {\n  <p>No messages received yet.</p>\n}\n",
		styles: [".messages{list-style:none;padding:0}.messages li{padding:4px 0;border-bottom:1px solid #eee}.messages .topic{font-weight:700}\n"],
		changeDetection: i0.ChangeDetectionStrategy.Eager
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: MqttBrokerComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-mqtt-broker",
			providers: [MqttBrokerService],
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false,
			template: "<h2>MQTT Broker</h2>\n\n<p class=\"connection-status\">Status: {{ connected ? 'Connected' : 'Disconnected' }}</p>\n\n@if (messages.length > 0) {\n  <ul class=\"messages\">\n    @for (message of messages; track message) {\n      <li>\n        <span class=\"topic\">{{ message.topic }}</span>: <span class=\"payload\">{{ message.payload }}</span>\n      </li>\n    }\n  </ul>\n} @else {\n  <p>No messages received yet.</p>\n}\n",
			styles: [".messages{list-style:none;padding:0}.messages li{padding:4px 0;border-bottom:1px solid #eee}.messages .topic{font-weight:700}\n"]
		}]
	}],
	ctorParameters: () => [{ type: MqttBrokerService }]
});
const routes = [{
	path: "",
	component: MqttBrokerComponent
}];
var MqttBrokerModule = class MqttBrokerModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MqttBrokerModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MqttBrokerModule,
		declarations: [MqttBrokerComponent],
		imports: [CommonModule, i1.RouterModule],
		exports: [MqttBrokerComponent]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MqttBrokerModule,
		imports: [CommonModule, RouterModule.forChild(routes)]
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: MqttBrokerModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [MqttBrokerComponent],
			imports: [CommonModule, RouterModule.forChild(routes)],
			exports: [MqttBrokerComponent]
		}]
	}]
});
export { MQTT_CONNECT, MqttBrokerComponent, MqttBrokerModule, MqttBrokerService };

//# sourceMappingURL=mqtt-broker.mjs.map