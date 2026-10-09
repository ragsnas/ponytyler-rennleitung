import * as mqtt from 'mqtt';

/** The backend's plain MQTT/TCP listener, published on host port 3011 in the e2e stack. */
export const MQTT_TCP_URL = 'mqtt://localhost:3011';

export type BikeId = '1' | '2';

export interface BikeStatus {
  pulsecount: number;
  sequenz: number;
  timestamp: number;
}

/** A bike counts as finished once its pulsecount exceeds this (see be/src/mqtt/bike-race-tracker.ts). */
export const FINISH_PULSECOUNT = 121;

/**
 * Publishes to the backend's embedded broker the way the bike sensors and
 * show-control hardware do. A payload that is not a string is sent as JSON;
 * a string is sent as is, which is how a spec sends garbage.
 */
export async function connectMqttPublisher(url: string = MQTT_TCP_URL) {
  const client = mqtt.connect(url);
  await new Promise<void>((resolve, reject) => {
    client.once('connect', () => resolve());
    client.once('error', reject);
  });

  function publish(topic: string, payload: object | string): Promise<void> {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return new Promise((resolve, reject) => {
      client.publish(topic, body, { qos: 1 }, (err) => (err ? reject(err) : resolve()));
    });
  }

  return {
    publish,

    publishBikeStatus: (bikeId: BikeId, status: BikeStatus) => publish(`Bike/${bikeId}`, status),

    /** A bike crossing the finish line; `sequenz` orders the two bikes' finishes. */
    publishBikeFinished: (bikeId: BikeId, sequenz: number) =>
      publish(`Bike/${bikeId}`, { pulsecount: FINISH_PULSECOUNT, sequenz, timestamp: Date.now() }),

    publishRaceStateChange: (raceId: number, state: string) => publish('RaceStateChange', { raceId, state }),

    publishShowStateChange: (showId: number, state: string) => publish('ShowStateChange', { showId, state }),

    close: () => client.endAsync(true),
  };
}

export type MqttPublisher = Awaited<ReturnType<typeof connectMqttPublisher>>;
