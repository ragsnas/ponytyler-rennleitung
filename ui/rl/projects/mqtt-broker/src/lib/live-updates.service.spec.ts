import { fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { MqttBrokerMessage, MqttBrokerService } from './mqtt-broker.service';
import { FALLBACK_POLL_INTERVAL_MS, LiveUpdatesService } from './live-updates.service';

describe('LiveUpdatesService', () => {
  let connected$: Subject<boolean>;
  let messages$: Subject<MqttBrokerMessage>;
  let broker: { connect: jasmine.Spy; connected$: Subject<boolean>; messages$: Subject<MqttBrokerMessage> };
  let doc: { visibilityState: string; defaultView: { location: { protocol: string; host: string } } };
  let service: LiveUpdatesService;

  const message = (topic: string, payload: unknown): MqttBrokerMessage => ({
    topic,
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    receivedAt: new Date(),
  });

  beforeEach(() => {
    connected$ = new Subject<boolean>();
    messages$ = new Subject<MqttBrokerMessage>();
    broker = { connect: jasmine.createSpy('connect'), connected$, messages$ };
    doc = { visibilityState: 'visible', defaultView: { location: { protocol: 'https:', host: 'rl.test' } } };
    service = new LiveUpdatesService(broker as unknown as MqttBrokerService, doc as unknown as Document);
  });

  describe('connection', () => {
    it('opens no connection until somebody listens', () => {
      expect(broker.connect).not.toHaveBeenCalled();
    });

    it('connects once, over WebSocket to the page host, for race and show changes only', () => {
      service.raceChanged$.subscribe();
      service.showChanged$.subscribe();
      service.connected$.subscribe();

      expect(broker.connect).toHaveBeenCalledTimes(1);
      expect(broker.connect).toHaveBeenCalledWith('wss://rl.test/mqtt-ws', ['RaceStateChange', 'ShowStateChange']);
    });

    it('uses ws:// for a page served over http', () => {
      doc.defaultView.location.protocol = 'http:';

      service.raceChanged$.subscribe();

      expect(broker.connect).toHaveBeenCalledWith('ws://rl.test/mqtt-ws', jasmine.any(Array));
    });

    it('tells the current connection state to whoever asks, also late', () => {
      const seen: boolean[] = [];
      service.connected$.subscribe();
      connected$.next(true);

      service.connected$.subscribe((connected) => seen.push(connected));

      expect(seen).toEqual([true]);
    });

    it('starts as not connected', () => {
      const seen: boolean[] = [];

      service.connected$.subscribe((connected) => seen.push(connected));

      expect(seen).toEqual([false]);
    });
  });

  describe('typed changes', () => {
    it('emits the race that changed and its new state', () => {
      const changes: unknown[] = [];
      service.raceChanged$.subscribe((change) => changes.push(change));

      messages$.next(message('RaceStateChange', { raceId: '5', state: 'RACING' }));

      expect(changes).toEqual([{ raceId: '5', state: 'RACING' }]);
    });

    it('emits the show that changed and its new state', () => {
      const changes: unknown[] = [];
      service.showChanged$.subscribe((change) => changes.push(change));

      messages$.next(message('ShowStateChange', { showId: '2', state: 'BEFORE_RACE' }));

      expect(changes).toEqual([{ showId: '2', state: 'BEFORE_RACE' }]);
    });

    it('keeps race and show changes apart, and ignores other topics', () => {
      const races: unknown[] = [];
      const shows: unknown[] = [];
      service.raceChanged$.subscribe((change) => races.push(change));
      service.showChanged$.subscribe((change) => shows.push(change));

      messages$.next(message('ShowStateChange', { showId: '2', state: 'RACE' }));
      messages$.next(message('Bike/1', { pulsecount: 3 }));

      expect(races).toEqual([]);
      expect(shows.length).toBe(1);
    });

    it('survives a message that is not JSON, or lacks the id, and carries on', () => {
      const changes: unknown[] = [];
      service.raceChanged$.subscribe((change) => changes.push(change));

      messages$.next(message('RaceStateChange', 'garbage'));
      messages$.next(message('RaceStateChange', { state: 'RACING' }));
      messages$.next(message('RaceStateChange', 'null'));
      messages$.next(message('RaceStateChange', { raceId: '6', state: 'DONE' }));

      expect(changes).toEqual([{ raceId: '6', state: 'DONE' }]);
    });
  });

  describe('refreshNeeded$', () => {
    let refreshes: number;
    /** Listens inside the test, so that fakeAsync tests own the timers. */
    const listen = () => {
      refreshes = 0;
      service.refreshNeeded$.subscribe(() => refreshes++);
    };

    it('fires for every race change and every show change', () => {
      listen();
      messages$.next(message('RaceStateChange', { raceId: '5', state: 'RACING' }));
      messages$.next(message('ShowStateChange', { showId: '2', state: 'RACE' }));

      expect(refreshes).toBe(2);
    });

    it('does not fire when the connection is made for the first time', () => {
      listen();
      connected$.next(true);

      expect(refreshes).toBe(0);
    });

    it('fires once when the connection comes back, because changes may have been missed', () => {
      listen();
      connected$.next(true);
      connected$.next(false);
      connected$.next(true);

      expect(refreshes).toBe(1);
    });

    it('does not poll while connected', fakeAsync(() => {
      listen();
      connected$.next(true);

      tick(FALLBACK_POLL_INTERVAL_MS * 3);

      expect(refreshes).toBe(0);
      discardPeriodicTasks();
    }));

    it('polls slowly while not connected, and stops once connected', fakeAsync(() => {
      listen();
      tick(FALLBACK_POLL_INTERVAL_MS);
      expect(refreshes).toBe(1);
      tick(FALLBACK_POLL_INTERVAL_MS);
      expect(refreshes).toBe(2);

      connected$.next(true);
      tick(FALLBACK_POLL_INTERVAL_MS * 3);

      expect(refreshes).toBe(2);
      discardPeriodicTasks();
    }));

    it('polls again after the connection is lost', fakeAsync(() => {
      listen();
      connected$.next(true);
      connected$.next(false);

      tick(FALLBACK_POLL_INTERVAL_MS);

      expect(refreshes).toBe(1);
      discardPeriodicTasks();
    }));

    it('does not poll while the page is hidden', fakeAsync(() => {
      listen();
      doc.visibilityState = 'hidden';

      tick(FALLBACK_POLL_INTERVAL_MS * 2);
      expect(refreshes).toBe(0);

      doc.visibilityState = 'visible';
      tick(FALLBACK_POLL_INTERVAL_MS);
      expect(refreshes).toBe(1);
      discardPeriodicTasks();
    }));

    it('polls less often than the 5 s the pages polled before', () => {
      expect(FALLBACK_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(30000);
    });
  });
});
