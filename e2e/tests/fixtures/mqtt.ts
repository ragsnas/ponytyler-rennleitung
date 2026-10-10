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

export const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface ReceivedMessage {
  topic: string;
  /** The parsed JSON payload, or the raw text when it is not JSON (an empty payload is ''). */
  body: unknown;
}

/**
 * Records everything published on the backend broker, to assert on the
 * announcements (state changes, "bike won") the backend makes. It sees all
 * traffic, including other tests', so match on ids.
 */
export async function connectMqttListener(url: string = MQTT_TCP_URL) {
  const client = mqtt.connect(url);
  const received: ReceivedMessage[] = [];
  client.on('message', (topic, payload) => {
    const text = payload.toString();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // not JSON: keep the text
    }
    received.push({ topic, body });
  });
  await new Promise<void>((resolve, reject) => {
    client.once('error', reject);
    client.once('connect', () => client.subscribe('#', (err) => (err ? reject(err) : resolve())));
  });

  return {
    /**
     * Forgets everything received so far. The listener connects while a test
     * still queues for a lock, so call this once the test holds it, before
     * counting messages that carry no id (e.g. "Bike/1/won").
     */
    clear: (): void => {
      received.length = 0;
    },

    /** What arrived so far, optionally only for one topic. */
    messages: (topic?: string): ReceivedMessage[] => received.filter((message) => topic === undefined || message.topic === topic),

    /** Resolves with the body of the first message on the topic (including ones already received) that matches. */
    async waitFor(topic: string, matches: (body: unknown) => boolean = () => true, timeoutMs = 10000): Promise<unknown> {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const found = received.find((message) => message.topic === topic && matches(message.body));
        if (found) {
          return found.body;
        }
        if (Date.now() > deadline) {
          const seen = received.filter((message) => message.topic === topic).map((message) => JSON.stringify(message.body));
          throw new Error(`no matching message on "${topic}" within ${timeoutMs}ms (seen on that topic: [${seen.join(', ')}])`);
        }
        await pause(25);
      }
    },

    close: () => client.endAsync(true),
  };
}

export type MqttListener = Awaited<ReturnType<typeof connectMqttListener>>;
