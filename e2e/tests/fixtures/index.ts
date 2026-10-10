import { test as base } from '@playwright/test';
import { createApi, SeedingApi } from './api';
import { acquireLock } from './lock';
import { createSonglist, Songlist } from './songlist';
import { connectMqttListener, connectMqttPublisher, MqttListener, MqttPublisher } from './mqtt';

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';
export { BACKEND_URL, createApi } from './api';
export type { Race, RaceOptions, SeedingApi, Show, Song } from './api';
export { connectMqttListener, connectMqttPublisher, FINISH_PULSECOUNT, MQTT_TCP_URL, pause } from './mqtt';
export type { BikeId, BikeStatus, MqttListener, MqttPublisher, ReceivedMessage } from './mqtt';
export { acquireLock } from './lock';
export { SONGLIST_URL } from './songlist';
export type { CloudSong, Songlist } from './songlist';
export { chooseSyncFiles, dismissSuccessSnackBar, rowByText, syncListItem } from './ui';
export { distinctName, uniqueName } from './unique';

const LOCK_FIXTURE_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * `test` with the shared fixtures:
 *
 *  - `api`:           seeds shows, songs and races through REST and deletes
 *                     them again after the test.
 *  - `mqttPublisher`: a connection to the backend broker for publishing
 *                     sensor and state messages, closed after the test.
 *
 *  - `mqttListener`:  records what is published on the broker (state changes,
 *                     "bike won"), for asserting on the backend's announcements.
 *  - `exclusiveRaceState`: opt-in. Holds a lock across all workers for the
 *                     duration of the test. Use it in any test that sets a
 *                     race to RACING or RACED, or that reads such a race back,
 *                     and in any test that makes a show live or changes a
 *                     live show's state, or relies on the bike tracker. The
 *                     backend allows only ONE active race and ONE active show
 *                     in the whole database and resets every other one to
 *                     LISTED (RaceService.resetOtherActiveRaces,
 *                     ShowService.resetOtherActiveShows), and the MQTT broker
 *                     tracks one race at a time, so two such tests running in
 *                     parallel would undo each other.
 *
 *  - `exclusiveSongs`: opt-in lock across workers, for tests that change
 *                     every song at once (flipping `selectable` globally,
 *                     "Block all Songs, missing from File List") and must
 *                     not overlap each other. Only for *.global.spec.ts.
 *  - `songlist`:      sets the cloud songlist the backend syncs from (the
 *                     stub) and restores the default list afterwards. It
 *                     includes `exclusiveSongs`. Only for *.global.spec.ts.
 *
 * All are created lazily, so a spec that uses none pays nothing.
 */
export const test = base.extend<{
  api: SeedingApi;
  mqttPublisher: MqttPublisher;
  mqttListener: MqttListener;
  exclusiveRaceState: void;
  exclusiveSongs: void;
  songlist: Songlist;
}>({
  mqttListener: async ({}, use) => {
    const listener = await connectMqttListener();
    try {
      await use(listener);
    } finally {
      await listener.close();
    }
  },

  exclusiveSongs: [
    async ({}, use) => {
      const release = await acquireLock('songs');
      try {
        await use();
      } finally {
        await release();
      }
    },
    // Queuing for the lock must not eat the test's own timeout.
    { timeout: LOCK_FIXTURE_TIMEOUT_MS },
  ],

  songlist: async ({ request, exclusiveSongs }, use) => {
    const songlist = createSonglist(request);
    try {
      await use(songlist);
    } finally {
      await songlist.reset();
    }
  },

  exclusiveRaceState: [
    async ({}, use) => {
      const release = await acquireLock('race-state');
      try {
        await use();
      } finally {
        await release();
      }
    },
    { timeout: LOCK_FIXTURE_TIMEOUT_MS },
  ],

  api: async ({ request }, use) => {
    const api = createApi(request);
    try {
      await use(api);
    } finally {
      await api.cleanup();
    }
  },

  mqttPublisher: async ({}, use) => {
    const publisher = await connectMqttPublisher();
    try {
      await use(publisher);
    } finally {
      await publisher.close();
    }
  },
});
