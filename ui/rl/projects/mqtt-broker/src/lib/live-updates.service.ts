import { DOCUMENT, Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  defer,
  EMPTY,
  filter,
  map,
  merge,
  Observable,
  scan,
  switchMap,
  timer,
} from 'rxjs';
import type { RaceState } from 'projects/backend-api/src/lib/race.service';
import type { ShowState } from 'projects/backend-api/src/lib/show.service';
import { MqttBrokerMessage, MqttBrokerService } from './mqtt-broker.service';

const RACE_STATE_CHANGE_TOPIC = 'RaceStateChange';
const SHOW_STATE_CHANGE_TOPIC = 'ShowStateChange';

/**
 * How often a page reloads on its own while it has no live connection. Slow
 * on purpose: with a connection the backend tells the page when to reload.
 */
export const FALLBACK_POLL_INTERVAL_MS = 30000;

export interface RaceStateChange {
  raceId: string;
  state: RaceState;
}

export interface ShowStateChange {
  showId: string;
  state: ShowState;
}

/**
 * What the backend announces over MQTT (`RaceStateChange`, `ShowStateChange`),
 * as typed streams, so pages reload when something happened instead of
 * polling. One connection for the whole app, opened when the first page
 * listens, subscribed to those two topics only (not the bike telemetry).
 *
 * The backend announces changes of a race's or show's STATE. Creating,
 * editing, reordering or deleting a race is not announced; a page that has to
 * show those as they happen still needs its own refresh.
 */
@Injectable({ providedIn: 'root' })
export class LiveUpdatesService {
  private started = false;
  private readonly connectionState = new BehaviorSubject<boolean>(false);

  /** Whether the live connection is up; tells the current state to every new subscriber. */
  readonly connected$: Observable<boolean> = defer(() => {
    this.start();
    return this.connectionState.asObservable();
  });

  readonly raceChanged$: Observable<RaceStateChange> = this.changes<RaceStateChange>(
    RACE_STATE_CHANGE_TOPIC,
    'raceId',
  );

  readonly showChanged$: Observable<ShowStateChange> = this.changes<ShowStateChange>(
    SHOW_STATE_CHANGE_TOPIC,
    'showId',
  );

  /**
   * Fires when a page should reload what it shows: a race or show changed,
   * the connection came back (changes may have been missed meanwhile), or,
   * while there is no connection and the page is visible, every
   * FALLBACK_POLL_INTERVAL_MS.
   */
  readonly refreshNeeded$: Observable<void> = defer(() =>
    merge(
      this.raceChanged$,
      this.showChanged$,
      this.reconnected(),
      this.fallbackPoll(),
    ).pipe(map(() => undefined)),
  );

  constructor(
    private readonly broker: MqttBrokerService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  private start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.broker.connected$.subscribe((connected) => this.connectionState.next(connected));
    this.broker.connect(this.brokerUrl(), [RACE_STATE_CHANGE_TOPIC, SHOW_STATE_CHANGE_TOPIC]);
  }

  private brokerUrl(): string {
    const location = this.document.defaultView?.location;
    const protocol = location?.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${location?.host}/mqtt-ws`;
  }

  /** The messages of one topic, parsed; messages that are not JSON or lack their id are dropped. */
  private changes<T extends object>(topic: string, idKey: keyof T): Observable<T> {
    return defer(() => {
      this.start();
      return this.broker.messages$.pipe(
        filter((message) => message.topic === topic),
        map((message) => this.parse<T>(message)),
        filter((change): change is T => change != null && change[idKey] != null),
      );
    });
  }

  private parse<T>(message: MqttBrokerMessage): T | null {
    try {
      return JSON.parse(message.payload) as T | null;
    } catch {
      return null;
    }
  }

  private reconnected(): Observable<boolean> {
    return this.connected$.pipe(
      scan(
        (state, connected) => ({
          connected,
          everConnected: state.everConnected || connected,
          reconnect: connected && state.everConnected && !state.connected,
        }),
        { connected: false, everConnected: false, reconnect: false },
      ),
      filter((state) => state.reconnect),
      map((state) => state.reconnect),
    );
  }

  private fallbackPoll(): Observable<number> {
    return this.connected$.pipe(
      switchMap((connected) =>
        connected ? EMPTY : timer(FALLBACK_POLL_INTERVAL_MS, FALLBACK_POLL_INTERVAL_MS),
      ),
      filter(() => this.document.visibilityState === 'visible'),
    );
  }
}
