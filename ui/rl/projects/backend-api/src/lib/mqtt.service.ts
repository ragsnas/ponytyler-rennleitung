import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import mqtt from "mqtt";
import os from "os";

@Injectable({
  providedIn: "root",
})
export class MqttService implements OnInit, OnDestroy {

  private client: mqtt.MqttClient | undefined;

  constructor(private http: HttpClient) {
  }

  ngOnDestroy(): void {
    if (this.client) {
      this.client.end();
    }
  }

  ngOnInit(): void {
    this.client = this.getMqttClient();
  }

  private getMqttClient(): mqtt.MqttClient {
    const brokerUri = `mqtt://localhost:3001`;
    return mqtt.connect(brokerUri, {
      clientId: "mqtt-service",
    });
  }
}
