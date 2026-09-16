import { test, expect } from '@playwright/test';
import * as mqtt from 'mqtt';

/**
 * Exercises the "MQTT Broker" page end to end: it connects over WebSocket
 * to the MQTT broker embedded in the backend (see ../../be/src/mqtt/README.md)
 * and must show messages published to the broker live. The backend's plain
 * MQTT/TCP listener is published on host port 3011 in the e2e stack (mapped
 * from container port 3001, see ../../docker-compose.e2e.yml) — this test
 * uses it to publish a message the same way real sensors/hardware would,
 * bypassing the frontend entirely for the "publish" side.
 */

const MQTT_TCP_URL = 'mqtt://localhost:3011';

test('the MQTT Broker page shows messages published to the backend broker, live', async ({ page }) => {
  await page.goto('/mqtt-broker');

  await expect(page.getByText('MQTT Broker', { exact: true })).toBeVisible();
  await expect(page.getByText('Status: Connected')).toBeVisible({ timeout: 15000 });

  const topic = `E2E/mqtt-broker-page/${Date.now()}`;
  const payload = JSON.stringify({ hello: 'e2e', at: Date.now() });

  const publisher = mqtt.connect(MQTT_TCP_URL);
  try {
    await new Promise<void>((resolve, reject) => {
      publisher.once('connect', () => resolve());
      publisher.once('error', reject);
    });

    publisher.publish(topic, payload);

    await expect(page.getByText(topic, { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(payload, { exact: true })).toBeVisible();
  } finally {
    publisher.end(true);
  }
});
