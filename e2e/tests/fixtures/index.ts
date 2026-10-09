import { test as base } from '@playwright/test';
import { createApi, SeedingApi } from './api';
import { acquireLock } from './lock';
import { connectMqttPublisher, MqttPublisher } from './mqtt';

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';
export { BACKEND_URL, createApi } from './api';
export type { Race, RaceOptions, SeedingApi, Show, Song } from './api';
export { connectMqttPublisher, FINISH_PULSECOUNT, MQTT_TCP_URL } from './mqtt';
export type { BikeId, BikeStatus, MqttPublisher } from './mqtt';
export { acquireLock } from './lock';
export { dismissSuccessSnackBar, rowByText } from './ui';
export { uniqueName } from './unique';

/**
 * `test` with the shared fixtures:
 *
 *  - `api`:           seeds shows, songs and races through REST and deletes
 *                     them again after the test.
 *  - `mqttPublisher`: a connection to the backend broker for publishing
 *                     sensor and state messages, closed after the test.
 *
 *  - `exclusiveRaceState`: opt-in. Holds a lock across all workers for the
 *                     duration of the test. Use it in any test that sets a
 *                     race to RACING or RACED, or that reads such a race back:
 *                     the backend allows only ONE such race in the whole
 *                     database and resets every other one to LISTED
 *                     (RaceService.resetOtherActiveRaces), so two of these
 *                     tests running in parallel would undo each other.
 *
 * All are created lazily, so a spec that uses none pays nothing.
 */
export const test = base.extend<{ api: SeedingApi; mqttPublisher: MqttPublisher; exclusiveRaceState: void }>({
  exclusiveRaceState: async ({}, use) => {
    const release = await acquireLock('race-state');
    try {
      await use();
    } finally {
      await release();
    }
  },

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
