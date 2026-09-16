# MQTT Broker (embedded in the NestJS backend)

The race-control MQTT broker used to run as a separate Bun process
(`mqtt/broker.ts`). It now runs **inside the NestJS backend** as an ordinary
Nest provider: [`MqttBrokerService`](./mqtt-broker.service.ts), wired up by
[`MqttModule`](./mqtt.module.ts) and imported from `AppModule`.

It uses [Aedes](https://github.com/moscajs/aedes) to host a real MQTT broker
on a plain TCP socket (not an MQTT client connecting to some other broker —
this *is* the broker). Bike sensors, the show-control hardware, and any
helper/test scripts all connect to it the same way they connected to the old
standalone broker.

## How it starts and stops

There is no separate broker process to manage — it starts and stops with the
backend itself:

- **Start**: run the backend (`npm run start:dev`, `npm run start:prod`, or
  via Docker Compose). `MqttBrokerService.onApplicationBootstrap()` creates
  the Aedes instance and opens the TCP listener as part of Nest's normal
  application bootstrap, right after all modules are wired up.
- **Stop**: stop the backend (`Ctrl+C`, `docker-compose stop backend`, etc.).
  `MqttBrokerService.onModuleDestroy()` closes the TCP server and the Aedes
  broker cleanly as part of Nest's shutdown hooks.

There's no separate `npm run` script for the broker — starting/stopping the
NestJS app *is* starting/stopping the broker.

## Configuration

| Env var        | Default | Description                                        |
|----------------|---------|-----------------------------------------------------|
| `MQTT_PORT`    | `3001`  | TCP port the embedded broker listens on.             |
| `MQTT_WS_PORT` | `3002`  | Port the same broker listens on for MQTT-over-WebSocket. |

Set it like any other backend env var (`.env`, shell, or the `environment:`
block in `docker-compose.yml` / `docker-compose.prod.yml`).

## Connecting to it

### Local development (no Docker)

```bash
cd be
npm run start:dev
```

The broker listens on `mqtt://localhost:3001` (or whatever `MQTT_PORT` is
set to) for plain MQTT clients, and on `ws://localhost:3002` (or whatever
`MQTT_WS_PORT` is set to) for MQTT-over-WebSocket clients, e.g. the "MQTT
Broker" page in the Angular frontend (`ui/rl/projects/mqtt-broker`), which
can't open a raw TCP socket from the browser.

### Via Docker Compose

`docker-compose.yml` / `docker-compose.prod.yml` publish the backend's
`3001` and `3002` ports to the host, so from your machine it's still:

```
mqtt://localhost:3001
ws://localhost:3002
```

From another container on the `ponytyler-network`, use the backend's
container hostname instead:

```
mqtt://backend:3001
ws://backend:3002
```

The Angular frontend's dev server proxies `/mqtt-ws` to `ws://backend:3002`
(see `ui/rl/src/proxy.conf.json`), so browser code just connects to
`ws://<frontend-host>/mqtt-ws`.

### Example: publish a bike status message

Using the [`mqtt`](https://www.npmjs.com/package/mqtt) CLI/client
(`npx mqtt pub ...` or a small script):

```bash
npx mqtt pub -t 'Bike/1' -m '{"pulsecount":10,"sequenz":1,"timestamp":1}' -h localhost -p 3001
```

Or with `mosquitto_pub`:

```bash
mosquitto_pub -h localhost -p 3001 -t 'Bike/1' -m '{"pulsecount":10,"sequenz":1,"timestamp":1}'
```

### Topics

- `Bike/1`, `Bike/2` — bike status messages: `{ pulsecount, sequenz, timestamp }`.
  Once `pulsecount` exceeds the finish threshold, the broker tracks the
  finish and winner detection in memory (see `mqtt-broker.service.ts`).
- `Bike/1/cmd`, `Bike/2/cmd` — free-form commands for a bike, just logged.
- Anything else is logged as an unrecognized message (no error — publishing
  is not restricted to these topics).
- `RaceStateChange` — state machine status messages for races: `{ raceId, state }`.
- `ShowStateChange` — state machine status message for show: `{ showId, state }`.

See `helper/fake-mqtt-signal-producer` in the repo root for a script that
simulates bike sensor traffic against this broker.

## Why move it into the backend?

The standalone Bun broker duplicated deployment/ops surface (its own
Dockerfile, container, health check, and env wiring) for a broker that only
the backend's race-control logic ultimately needs to talk to. Hosting it as
a Nest provider removes that separate process, keeps its lifecycle tied to
the backend's own lifecycle, and lets it share the backend's logging,
config, and (eventually, if needed) the rest of the race domain.
