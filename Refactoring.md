# Refactoring & Review – ponytyler-rennleitung

Critical review of the whole repository (`be/` NestJS backend, `ui/rl/` Angular workspace, `e2e/` Playwright, Docker/compose/scripts, `Arduino/`, `helper/`, `easy-song-sync/`), focused on **code quality, maintainability and performance**.

**How to read this document**

- Severity: **H**igh / **M**edium / **L**ow. Effort: **S** (< 1 day) / **M** (1–3 days) / **L** (> 3 days).
- ✔ = I re-checked the claim directly in the code. Everything else was found by a full read of the sources by review passes and is *reported – verify before fixing* (line numbers are approximate, ±3).
- Fixes should follow the project rule **TDD**: write the failing test first, then fix. One PR per finding group.

---

## 1. Summary

**Strengths:** feature-rich and well-thought-out domain; 150 passing backend unit tests; good sub-docs for import/export/mqtt; the Angular code is `strict` with `strictTemplates`, new control flow (`@if/@for`) everywhere and no explicit `any`; the offline-bundle scripts (`scripts/*.sh`) and the isolated e2e compose stack are carefully done.

**Top risks**

1. **The race state machine has correctness bugs** (partial PATCH resets a running race, finish times never persisted, MQTT winner detection never resets, no transactions).
2. **The production path is broken or never exercised**: Prisma migrations are SQLite while the datasource is PostgreSQL, `mqtt` is a devDependency, the prod healthcheck hits the wrong URL, prod nginx has no `/api` / `/mqtt-ws` proxy.
3. **No authentication, no input validation, anonymous MQTT broker** on an API that can wipe the database.
4. **The frontend is eager, zone-based and polling**: "lazy" routes are not lazy (one ~1.65 MB bundle), 51 components are not OnPush, 18 "libraries" are never built as libraries, many stub components exist.
5. **Repository hygiene**: build output (`dist/`), DB backups and `.idea/` are tracked in git, causing ~270 changed files in every working tree.

---

## 2. Priority roadmap

| Phase | Goal | Contents |
|---|---|---|
| **0 – Quick wins** (hours) | stop obvious breakage and noise | §3 |
| **1 – Correctness** | trustworthy race/show logic | §4 |
| **2 – Production path & security** | deployable and safe | §5 |
| **3 – Performance** | snappy on a Raspberry Pi / LAN | §6 |
| **4 – Structure** | maintainability | §7 |
| **Cross-cutting** | tests, tooling, hardware | §8 |

---

## 3. Phase 0 – Quick wins (all effort S)

| ID | Where | Problem | Proposal | Sev |
|---|---|---|---|---|
| Q1 ✔ | `be/package.json` (`mqtt` under `devDependencies`), `be/Dockerfile.prod` | `mqtt` is imported at runtime by `race.service`, `show.service`, `mqtt-broker.service`; the prod image installs production deps only → crash on start. `--only=production` is also deprecated. | Move `mqtt` to `dependencies`; use `npm ci --omit=dev`. | H |
| Q2 ✔ | `docker-compose.prod.yml:22` | Healthcheck calls `/health`, the route is `/api/health` (`@Controller("api")` in `app.controller.ts`). The check can never pass, so the frontend (`depends_on: service_healthy`) never starts. | Fix the path; prefer `wget -qO-` or a `HEALTHCHECK` in the Dockerfile. | H |
| Q3 ✔ | `ui/rl/src/app/app-routing.module.ts:17-24` | `loadChildren: () => ShowModule` returns an already-imported class → no code splitting. | `() => import('…').then(m => m.ShowModule)` for all 8 routes (later: `loadComponent`/route arrays). | H |
| Q4 ✔ | `be/src/prisma-api/race.service.ts` `calculateRaceState` (~l.269-286) and `updateRace` | Falls back to `\|\| LISTED` when `raceState` is absent → any partial PATCH (e.g. only `person1`) resets a RACING race to LISTED. `show: { connect: { id: Number(data.showId) } }` is always sent (NaN without `showId`; e2e works around this in a comment). | Build the Prisma `data` only from keys present; derive state only when relevant fields change; load existing race first as fallback; make `show.connect` conditional. | H |
| Q5 ✔ | `race.service.ts` `updateRace` whitelist | `raceStartedAt` / `raceFinishedAt` are not mapped → finish time of every race is lost (broker passes it). | Map the fields (or spread a validated DTO) + test. | H |
| Q6 | `race.service.ts` `currentRace` fallback | `orderBy: orderNumber desc` picks the **last** listed race while the log says "next"; `markCurrentRaceAsWonBy` uses it → win may be written to the wrong race. | `asc` + test. | H |
| Q7 ✔ | `be/src/main.ts` | No `app.enableShutdownHooks()`; `OnModuleDestroy` (Prisma, MQTT, broker) never runs on SIGTERM. Port 3000 hard-coded. | Enable hooks; port from config. *Done in `be/src/app.setup.ts` (`PORT` env, default 3000).* | M |
| Q8 ✔ | `ui/rl/projects/ui/countdown/.../countdown.component.ts` | No `ngOnDestroy`/`clearInterval` (stopping a race mid-countdown still fires `countDownFinished` → `startRace()`); `countDown` initialised in a field initialiser before inputs are bound; emits at `1`, so the "GO!" branch is never shown. `export default` breaks `export *`. | `interval` + `takeUntilDestroyed`, init in `ngOnInit`, show start word then emit. | H |
| Q9 ✔(calc) | `ui/rl/projects/state-machine/.../state-machine.component.ts:96` and `race-track.component.html` | `progressInPercent = pulsecount / FULL_250M…` is a 0..1 fraction but is bound to `mat-progress-bar` (0..100) *(template binding reported)*; distance label divides by 100 but is labelled "m" (cm→m is /1000); both panels are headed "Bike 1"; average speed is Infinity/NaN when `timestamp` is 0. | ×100 + clamp, /1000, fix heading, guard division; unit-test `createBikeData`. | H |
| Q10 ✔ | `songs.component.html:44,47,84`, `shows.component.html:60`, `state-machine.component.html:35` | Invalid Material icon names (`checkbox`, `check-box`, `add-box`, `check_cricle`) render literal text (e2e even asserts on these strings). | Fix names (`check_box`, `add_box`, `check_circle`) and update e2e. | M |
| Q11 ✔ | `create-race.component.ts:57`, `edit-show.component.ts:66`, `create-show.component.ts` | `race.song1Id && race.song2Id` reads fields the form does not have → state is always WAITING_FOR_OPPONENT; `edit-show` forces `active: true` on every save (re-activates finished shows); `create-show` collects `shifts` but never sends them, mutates the form `Date` in place. | Fix + regression test. *Done; `create-show` no longer has a shifts form section (the `shift-from`/`shift-role-from` components were removed; shifts are managed via the shifts dashboard/wizard).* | H |
| Q12 ✔ | repo-wide | **Dead code**: `FilesearchController`/`NextcloudModule` (body commented out, no `api` prefix), `AppService.getHello`, BigInt `toJSON` patch (`main.ts`), `SongService.syncWithSingleSourceOfTruth` (+ unreachable shadowed route in `song.controller.ts`), FE stubs (`auth` ×2 `AuthService`, `audio-player`, `video-player`, `race-admin`, `choose-roles`, `delete-user`, `edit-user` – the last two are *linked* from the users list –, empty `BackupService`, `StateMachineService`, `RaceTrackService`, `ViewsService`, `CountdownService`, `YesNoDialogService`, `OverviewComponent`, `ShowComponent`, `SongComponent`, `UploadDialogComponent`, `utilities/form-control-pipe`), `director-dashboard` redirect to a non-existent route. | Delete (or ticket + remove links). Their trivial `should create` specs disappear too. | M |
| Q13 ✔ | tracked files | `be/dist`, `ui/rl/dist` (~4 MB), `helper/**/dist`, `.idea/` (13 files), `be/prisma/backups/*.db` + `kesselhalle-race-inserts.sql` are tracked although (partly) gitignored; `be/.gitignore` has no `dist`; stale hashed bundles accumulate. `.dockerignore` does not exclude `prisma/*.db` (baked into dev image). | `git rm -r --cached …`, extend `.gitignore` (`dist`, `.idea`, `offline-bundle/`, `*.tar`, `prisma/**/*.db`). **If the backups contain real rider data, purge git history.** If dist is needed on the Pi, build there / in CI. *Done: untracked + ignored; `update_pi.sh`/`setup_pi.sh` now build the UI (and backend) on the Pi. **Open:** the old backups (real user/rider names) are still in git history, purge not done.* | H |
| Q14 ✔ | `be/package.json` | Unused: `usb` (forces python/make/g++/libusb into images), `webdav`, `@nestjs/mapped-types`, `ts-md5` (use `crypto`), direct `axios`; `prisma` CLI in `dependencies`; `@types/node ^20` vs Node 26 images. FE: `material-icons: "*"` unpinned, stray `istanbul-lib-instrument`. | Remove / pin / align. *Done, except `axios` (required peer of `@nestjs/axios`) and `prisma` (the prod image runs `npx prisma migrate deploy`) which stay in `dependencies`; also dropped the `usb`-only apk packages from the Dockerfiles (untested image build).* | M |

---

## 4. Phase 1 – Correctness

### A. Backend race & show logic

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| A1 ✔ | `mqtt-broker.service.ts` (`finished` set l.~276, `initialBikeState()` only at l.~74-75) | *Reported, verify on hardware flow:* bike state is never reset after startup → from the 2nd race on `!finished` is false and **no winner is detected until restart**. | Extract a pure `BikeRaceTracker` (injected clock); reset on `RaceStateChange` → WAITING_TO_RACE/RACING. Tests: consecutive races, tie, bike 2 wins. *Done: `bike-race-tracker.ts`, reset on `RaceStateChange` → `WAITING_TO_RACE`/`RACING` (tests: consecutive races, tie, bike 2 wins; plus an MQTT integration test). Not verified on the real hardware flow.* | H / M |
| A2 | `mqtt-broker.service.ts` l.~348-368 | `bikeStates` arrays are pushed per message and never read/trimmed → unbounded growth. | Delete or ring buffer. | M / S |
| A3 | `mqtt-broker.service.ts` l.~231-272, ~103-109 | 1 s `setTimeout` not tracked (fires after `onModuleDestroy` on a closed client); `listen()` ignores `error` (EADDRINUSE); tie logged as "bike 2"; `console.log` instead of `Logger`; deprecated `substr`. | Track/clear timer, reject on server `error`, fix message. | M / S |
| A4 | `race.service.ts` l.~125-180, `show.service.ts` l.~79-125 | `updateRace` = findUnique → update → findMany → sequential updates, **no transaction**; concurrent UI + MQTT updates can leave two active races; event published before the others are reset; `resetOtherActiveRaces` is **not scoped by `showId`** (resets races of other shows). | `$transaction`, one `updateMany({ showId, id: {not}, raceState: {notIn} })`, publish after commit; optional partial unique index. | H / M |
| A5 | `race.service.ts` `createRace`, `encore-song.service.ts` | `orderNumber` computed in app code (`races()` loads every race **with songs** to read `[0]`); read-then-write race; no unique constraint; `Number(data.song1Id)` is NaN when absent although WAITING_FOR_OPPONENT races exist. | `aggregate _max` inside the tx + `@@unique([showId, orderNumber])`; pass optional songs as null. | M / M |
| A6 | `show.service.ts` `deleteShowWithRacesAndShifts` | Deletes races → shifts → shift roles → show; `ShiftRole.shiftId` has no cascade and `EncoreSong` is never deleted → FK failures. Extra `findMany` outside the tx. | `onDelete: Cascade` on `Shift.show`, `ShiftRole.shift`, `EncoreSong.show`, `Race.show`; reduce to `show.delete`; test with roles. | H / S |
| A7 | `show.controller.ts` (`.pop()` on desc list = oldest), `race.service.ts` (newest), `show.service.ts` `currentShow` (no `orderBy`) | Three definitions of "current show". | One `ShowService.getCurrentShow()` with a defined order. | M / S |
| A8 | `race.service.ts` `upcomingRace(s)WithSongs` | TypeError → HTTP 500 when there is no active show; two near-duplicate methods. | Return null/[]/404; merge. | M / S |
| A9 | `import.service.ts`, `export.service.ts` | `encore_songs` not exported/wiped/imported → import FK failures; default 5 s tx timeout; users' passwords silently nulled; no row validation; `$executeRawUnsafe` with interpolated table names. | Add EncoreSong (bump `formatVersion`), `{ timeout, maxWait }`, schema-validate rows, `Prisma.raw`, snapshot before import. | H / M |
| A10 | `stats.service.ts` + `prisma/sql/*.sql` | Query is driven by `song1Id` counts with `LEFT JOIN` song2 → songs only ever picked as `song2` are missing from most-played/wished and wrongly "never wished". No `LIMIT`; 3 near-copies; the `.sql` mirrors are unused (`typedSql` preview flag) and will drift. | `WITH picks AS (SELECT song1Id … UNION ALL SELECT song2Id …)`; one shared CTE; delete the unused copy + preview flag. | M / M |
| A11 | `cron/song-sync/song-sync.service.ts` `runSync` | `createSong/updateSong` fired in `forEach` with `.then` and **no await/catch** → unhandled rejections, `finally { syncInProgress=false }` runs early (lock ineffective); fetch failure only logged (trigger returns "success"); O(n·m) `find` re-normalising local names; unconditional UPDATE of every matched song each 30 min; new songs not added to lookup → duplicate rows (unique constraint was dropped); no axios timeout; `Promise.all` of unbounded updates in `updateSelectability`; log says "Created" on update; `replace(string)` replaces only first occurrence. | Build a `Map` once, diff in memory, `createMany({skipDuplicates})` / `updateMany`, await everything, rethrow, timeout, URL via config, restore a unique index on non-deleted `(artist,name)`. | H / M |

### B. Frontend bugs

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| H1 | `show-dashboard.component.ts:136-171` | An error inside the `switchMap(combineLatest(...))` kills the outer subscription → **polling silently stops**; `refreshing` is reset only in `next` → all action buttons stay disabled until reload. | `catchError` inside the inner `switchMap`; reset `refreshing` in `finalize`. | H / S |
| H2 | `state-machine.component.ts:214-250` | `updateRaceAndShow` awaits a `Subscription` (not awaitable) → show + race PATCH run in parallel, no ordering/atomicity; local state set from the request, not the response; same error text for start/countdown/finish; `raced: true` on start; one `setRaceDone` wired to two buttons; `getCurrentShowAndRace` (`firstValueFrom`) unhandled when no active show; `async` methods without `await`. | Server-side `POST /race/:id/transition` (atomic, validated) + `RaceControlService` with a pure transition table; take state from responses. | H / M |
| H3 | `which-bike-won-most.component.ts:24-26` | Maps 1→"White", 2→"Black"; dashboard treats `bikeWon: 1` as Black. | Shared `BikeWon` enum + single lookup (also replaces three doc copies). | M / S |
| H4 | `choose-shifts.component.ts:35-44`; `show.module.ts:62` | `push` loops wrong count, `splice(n)` returns the removed half, `<=` creates n+1 groups, `nextStep()` empty; route `roles` points to `ChooseUsersComponent`. | Fix + tests. | M / S |
| H5 | `app.component.ts:25-26`, `upcomming-races.component.ts:20-21` | "Active show" = `shows[0]`; fetches all shows although `getCurrentShow()` exists. | `find(s => s.active)` or `/current-show`. | M / S |
| H6 | `user-form.component.ts` | `validate()` exists but `NG_VALIDATORS` not provided → never runs; `Validators.min(1)` on text; inconsistent subscription cleanup. | Provide validator, `minLength`. | L / S |
| H7 | `director-dashboard.component.html:95-119, 56-71` | Compares `bikeWon === '1'` (string) with number; wrong labels ("Delete Song" for race actions). | Fix. | L / S |
| H8 | `backup.service.ts:15-26` | `Subject` never completes, HTTP `subscribe` without error handler, `try/catch` cannot catch async errors → failed request leaves "Download Backup" disabled forever. | Return the observable with `catchError`. | M / S |
| H9 | `form` flows `create-show`, `edit-show`, `create-race`, `update-race`, `add-encore` | `snackBar.open().afterDismissed().subscribe(navigate)` inside HTTP `next` → navigation delayed by the snackbar duration; nested subscribes. | Navigate on success, show snackbar independently. | L / S |

---

## 5. Phase 2 – Production path & security

### D. Schema & migrations

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| D1 ✔ | `be/prisma/migrations/**`, `migration_lock.toml` (`sqlite`), `schema.prisma` (`postgresql`) | Migration history is SQLite (`PRAGMA`, `AUTOINCREMENT`) and stale (no `showState`, `raceStartedAt/FinishedAt`, `encore_songs`). `prisma migrate deploy` – the documented prod path in `DOCKER.md` and `scripts/load-offline-bundle.sh` – cannot work. Dev/e2e use `db push`, so it is never exercised; a fresh prod DB has no tables. | Baseline one Postgres migration (`prisma migrate diff --from-empty --to-schema-datamodel`), set lock to `postgresql`, archive SQLite history, use `migrate deploy` in dev/e2e/prod (CI then covers it), provide a one-off SQLite→PG import for the Pi's `rl.db`. | H / M |
| D2 | `schema.prisma` | No `@@index` on `Race(showId, raceState, orderNumber)`, `Race.song1Id/song2Id`, `Shift.showId`, `ShiftRole.shiftId/userId`, `EncoreSong.showId/songId`, `Show(active)`; no `@@unique` on `Race(showId, orderNumber)`, `EncoreSong(showId, order)`; `Race.raceState` is a free `String` while an unused `enum RaceState` exists (TS enum duplicated in `race-state.enum.ts`; one import comes from `@prisma/client`); no `onDelete` rules; `pastUserName` is never written. | Add indexes/uniques, use the enum, define `onDelete`, implement or drop `pastUserName`. | M / M |

### J. Docker / compose / deployment

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| J1 | `be/Dockerfile.prod` | Final stage copies only `dist` + `.prisma` → no `prisma/` / `prisma.config.ts` so migrations cannot run; reinstalls the whole toolchain and canvas libs (`cairo/pango/giflib/pixman`, no canvas dependency); runs as root; floating tags (`node:26-alpine`, `nginx:alpine`, `oven/bun:latest`); no `HEALTHCHECK`. | Builder: `npm ci`, build, `npm prune --omit=dev`; runtime: copy node_modules + prisma dir, only runtime libs, `USER node`, pinned tags, entrypoint `migrate deploy`. Expect a much smaller image and faster arm64 builds. | H / M |
| J2 | `ui/rl/nginx_config`, `environment.prod.ts`, `docker-compose.prod.yml` | Prod nginx has **no `/api` and no `/mqtt-ws` proxy** (state machine / MQTT page connect to `ws://<host>/mqtt-ws` – only the dev `proxy.conf.json` provides it); API URL hard-coded to `http://ponytyler.local:3000/` (cross-origin, plain HTTP, works only because CORS `*`); `error_log … debug`; hard-coded `server_name`. | Same-origin proxy (`location /api/`, `location /mqtt-ws` with `Upgrade`/`Connection`), `apiUrl: '/api'`, don't publish 3000 on the host, `warn` log level. | H / M |
| J3 | `be/Dockerfile` (dev) | `ENV DATABASE_URL=…localhost` persists into runtime; `CMD node dist/main.js` without a build (works only because compose overrides); `EXPOSE` after `CMD`; `ui/rl/Dockerfile.dev` uses `npm install`. | Scope the placeholder to the `RUN`, `npm ci`. | M / S |
| J4 | `docker-compose*.yml` | dev and e2e are near-copies; credentials hard-coded in dev/e2e, from `.env` in prod; prod falls back to `postgres/postgres`; dev publishes 5432 to all interfaces; no healthchecks in dev/e2e (prod has them); prod publishes 3001 but not 3002 (docs say otherwise); `DOCKER.md` mentions port 5433 which is not published. | Base file + thin overrides (or profiles), `${DB_PASSWORD:?}`, bind to `127.0.0.1`, add `/api/health` checks, sync docs. | M / M |
| J5 | `scripts/build-offline-bundle.sh`, `load-offline-bundle.sh` | Good scripts, but: no arm64-emulation check, `rm -rf` before `docker save` (failed save leaves empty bundle), no checksum; `migrate deploy` right after `up -d` without waiting (race) and fails because of D1/J1; no pre-migration backup. | `up -d --wait`, `pg_dump` before migrate, checksum, cleanup trap. | M / S |
| J6 | `setup_pi.sh`, `update_pi.sh` | No shebang / `set -euo pipefail`; `git reset --hard` without confirmation; `pm2 restart all`; `cp *.db` breaks with >1 match; failed build still restarts; font dir skipped (`cp *.*`); SQLite assumptions; Node 22 vs `.nvmrc` 26; `apt` without `-y`; unconditional reboot; `curl | bash`. | Retire in favour of the offline Docker flow (document it); otherwise fix the basics. | H / M |

### B. Security & API hygiene (backend)

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| B1 | all controllers, `main.ts` | **No authN/Z**: unauthenticated `DELETE /api/show/:id`, `POST /api/import/database` (wipes DB), `POST /api/backup/upload`, `GET /api/user`; CORS `origin: "*"`. | Guard (shared secret or JWT) on mutating/admin routes, restricted CORS, `helmet`, `@nestjs/throttler` (strict on import/backup). Acceptable to start simple if LAN-only – but decide explicitly. | H / M-L |
| B2 | `mqtt-broker.service.ts`, compose | Anonymous broker, ports published: anyone can publish `Bike/1` with a high `pulsecount` (fake win) or `RaceStateChange`. | Aedes `authenticate` + `authorizePublish` (separate credentials for hardware and browser), bind to trusted interface. | H / M |
| B3 | controllers (`race`, `show`, `song`, `user`, `shifts`, `encore-song`), `main.ts` | `@Body() x: Prisma.*Input` is compile-time only; no `ValidationPipe`, no class-validator → nested Prisma operations (`{ races: { deleteMany: {} } }`, `password`) are passed straight to `prisma.*.update`; NaN ids → 500; `upOrDown` anything-not-"up" = down. | DTO classes (`PartialType` for updates), global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, `ParseIntPipe`, `@IsIn(["up","down"])`. | H / M |
| B4 | controllers | Nulls/Prisma errors not mapped: `findUnique` null → 200 with empty body (e2e asserts `{}`); P2025 → 500; `moveRacePosition` TypeError for unknown race. | Global exception filter (P2002→409, P2025→404), `NotFoundException`. | M / S-M |
| B5 | `user.controller.ts`, `schema.prisma` `User.password` | Passwords stored plain and returned by `GET /api/user`; nothing in `be/src` reads them. | Remove the column, or hash (argon2) and use a response DTO. | H / S |
| B6 | `backup.controller.ts`, `cron/db-backup/*`, `utils/*` | **Obsolete subsystem**: copies SQLite `prisma/rl.db` in a Postgres app; hard-coded `/home/ponytyler/...` paths duplicated; `FileInterceptor` memory storage → `file.path` undefined → `copyFileSync(undefined, <dir>)` throws (spec mocks `fs` and enshrines it); sync fs on the event loop; MD5 over binary-as-string; `isNumber(Number(name))` always true; method `hourly` runs every 6 h; Nest-internal import `shared.utils`. | Delete, or replace by `pg_dump` (cron/sidecar). Add upload `limits`. | H / S (delete) – M |
| B7 | `import.controller.ts`, `race.controller.ts` (`GET /api/race`), `song.controller.ts` search, show lists | Unbounded uploads (memory) and unbounded queries; search is case-sensitive and ignores `deleted`. | `limits.fileSize`, pagination with max `take`, `mode: "insensitive"`, `deleted:false`. | M / S-M |
| B8 | `easy-song-sync/index.php` | `die("Verbindung fehlgeschlagen: " . connect_error)` leaks DB details; `query()` unchecked; no `mysqli_report`; relative include outside the repo; whole table per request, no cache headers; `array_merge` single-arg no-op; `artist: null` rows. (No injection/SSRF risk – no input.) | `__DIR__`, exceptions → generic JSON 500, `Cache-Control`, README on where it's deployed. | M / S |

---

## 6. Phase 3 – Performance

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| P1 | `RaceService`, `ShowService`, `MqttBrokerService` | Three MQTT clients connect to the in-process broker over TCP using `mqtt://${os.hostname()}:${port}`; started before the broker listens; no `error`/`offline` handlers; QoS 0 fire-and-forget; port parsing/default copied 3×; the mock-show CLI also tries to connect. | One injectable `MqttPublisher` using `aedes.publish()` in-process; domain services publish through it. | M-H / M |
| P2 | `race.controller.ts` stats | `combineLatest` over Promises (rxjs for no reason), loads all RACED races/finished shows into memory, divides by `totalTime/60` without zero guard (NaN → `null` in JSON). | `count/aggregate/groupBy` + guard. | M / S |
| P3 ✔ | indexes | see D2 | Done: `@@index` added in `schema.prisma` (Race, Show, Shift, ShiftRole, EncoreSong); the `@@unique`/enum/`onDelete` parts stay with D2. Applied by `db push`; prod `migrate deploy` needs the Postgres baseline (D1). | M / S |
| P4 | FE routing | see Q3 – single 1.65 MB main bundle | – | H / S |
| P5 (partial) | FE change detection | 51 components use default CD (only `RaceTrackComponent` is OnPush). `ShowDashboard` runs a 250 ms `timer` + interval → whole-tree CD ~4×/s over a Material table; re-assigning an `Observable` field (`secondsRemainingPercentage$`) re-subscribes the async pipe each tick; Zone also triggers CD for every poll/MQTT message. | OnPush + signals (`signal`, `computed`, `input`, `toSignal`), CSS animation for the countdown bar, then zoneless (`provideZonelessChangeDetection`). Start with `ShowDashboard`, `StateMachine`, `AppComponent`. *Done: `ShowDashboard` and `StateMachine` are `OnPush` + signals, the 250 ms timer/`Observable` re-assignment is replaced by a CSS-animated countdown bar, `Countdown` calls `markForCheck`. **Not done:** `AppComponent` must stay default CD – an `OnPush` parent never re-renders default-CD routed pages that mutate plain fields (verified with a probe test); convert the remaining ~35 components first, then `AppComponent`, then zoneless.* | H / M |
| P6 | FE polling | Health poll every 5 s forever; dashboard polls 3 endpoints every 5-30 s; `NextRace`/`UpcomingRaces` fetch once and never refresh (the "live" views go stale) – while the backend already publishes `RaceStateChange`/`ShowStateChange` over MQTT. | One `LiveUpdatesService` exposing typed `raceChanged$`/`showChanged$`; `merge(refresh$, raceChanged$).pipe(switchMap(load))`; slow fallback poll only when disconnected and `document.visibilityState === 'visible'`; derive health from MQTT connection + failed requests. | H / M |
| P7 | `mqtt-broker.service.ts` (FE) | `subscribe('#')` receives all `Bike/*` telemetry even for components that need two topics; no `error/reconnect/offline` listeners; `JSON.parse` unguarded; debug component copies a 200-element array per message; `brokerUrl()` duplicated. | `topic$<T>(name)` streams with `filter/map/catchError`, ring buffer + virtual scroll in the debug view, URL token, "connection lost" indicator. | M / S-M |
| P8 | mat-tables (`show-dashboard.html:53,216`, `songs.component.html:42`, …) | No `trackBy`, whole array replaced each poll → all rows re-render, hover/focus lost. `@for … track song/option/file` uses object identity. | `trackBy`/`track item.id`. | M / S |
| P9 ✔ | `duplicates.component.ts:35-74` | O(n²) similarity on the main thread, refetches `getSelectableSongs()` on every slider tick, no debounce; per-song `console.log`. | Fetch once, debounce 200-300 ms, precompute nearest neighbour (or Web Worker), filter by threshold. *Done: neighbours computed once per fetch (`duplicates.util.ts`), the slider only re-filters (200 ms debounce), refetch only after a merge, logs removed. No Web Worker needed.* | M / M |
| P10 | `song-search/input.component.ts:63-100` | Every autocomplete instance fetches all selectable songs and all races of the show (create-race has two → 4 requests); `showId || ''` → `/for-show//all`; no debounce/cap; `(value as Song).name` throws on `null`; unsubscribed `valueChanges`; imports the whole `song` public API (pulls `SongModule`). | Shared cached `SongCatalogService` (`shareReplay`), `debounceTime(150)`, `slice(0, 50)`, `value?.name`. | M / M |
| P11 | `song-sync.component.ts:76-117` | `while(pop()) subscribe()` fires hundreds of PATCH/POST in parallel, no summary/refresh. | `from(items).pipe(mergeMap(fn, 4), toArray())` + progress; bulk endpoint. | L-M / S |
| P12 | templates | Function calls in bindings allocate per CD (`shiftFormControlsAsArray()`, `getShiftControlsAsFormGroups()`, `['RACING','WAITING_TO_RACE'].includes(x!)`, `isRaceFirstWaitingToRace(el)` per row, `getRandomStartWord()`); `$safeNavigationMigration(...)` leftovers. | `computed`/pure pipes, readonly constants, precomputed row flags. | L / S |
| P13 | `index.html:9-11`, `styles.scss:7` | Google Fonts + Material Icons CDN at runtime although the target is a LAN/Raspberry Pi; the icon font is also bundled (loaded twice). | Self-host (`@fontsource/roboto`), drop the CDN links. | M / S |
| P14 | `song-sync.service.ts`, PHP | see A11 / B8 – unconditional writes every 30 min, full-table dump per request | – | M |

---

## 7. Phase 4 – Structure & maintainability

### Backend

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| S1 | `mqtt-broker.service.ts` (373 lines) | God class: broker hosting, Node-26 `drainingHandler` monkey patch (`as Aedes`), topic routing, winner detection, persistence; `isBikeStatusPayload` only checks key presence (a string `pulsecount` is coerced); unknown payloads silently dropped; bikeId cast, not validated. | Split into `BrokerHost`, `BikeRaceTracker` (pure), `RaceResultWriter`; schema-validate payloads. | M / L |
| S2 | `PrismaApiModule` and services | Module named "PrismaApi" holds domain rules + MQTT (`RaceService`, `ShowService`); six copy-pasted `shows/races/songs/…` param wrappers; `UserService` provided in `UserModule`; duplicate `getCurrentShow/getCurrentShows`. | Feature modules with domain services + thin repositories. | M / L |
| S3 | config | `process.env.DATABASE_URL` in `prisma.service.ts`, `configService.get("MQTT_PORT")` in three places, `ConfigModule.forRoot({})` not global, hard-coded URLs/paths. | `ConfigModule.forRoot({ isGlobal: true, validate })` + typed `AppConfig` (`DATABASE_URL`, `MQTT_PORT`, `MQTT_WS_PORT`, `SONGLIST_URL`, `PORT`). | M / M |
| S4 | `tsconfig.json`, `eslint.config.js` | `strictNullChecks: false`, `noImplicitAny: false`, `no-explicit-any: off` – hides NPEs from A8/B4. `any` in `mqtt-broker.service.ts`, `user.controller.ts`, `show.controller.ts`. | Enable `strictNullChecks` first (est. < 40 errors), then `noImplicitAny`; `no-explicit-any: warn`. | M / M |
| S5 | logging | 13 `console.log` in non-test code (object dumps in `moveRacePosition`, per-update logs). | `Logger` with proper levels. | L / S |
| S6 | `generate-mock-show.module.ts` | CLI imports `CronModule` → starts `ScheduleModule`, DB-backup cron and MQTT clients. | Import only what the CLI needs. | L / S |
| S7 | `be/README.md` | Nest boilerplate; no env vars, ports, topics, architecture. | Write a real README (setup, env, Docker, MQTT topics). | L / S |

### Frontend

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| F1 | `ui/rl/projects/*`, `tsconfig.json` paths | **18 `ng-packagr` "libraries" that are not used as libraries**: app imports the sources directly; `dist/<lib>` paths never populated; libs import the app's `src/environments/environment`; `song/public-api.ts` re-exports `../../backend-api/...` (outside lib root); `show/public-api.ts`, `stats/public-api.ts` export non-existent files; `countdown` listed twice; stale `^14/^18` peer deps (Angular 22); ~100 boilerplate files (`karma.conf.js`, 3 tsconfigs, `package.json`, `ng-package.json`, README per lib). | **Recommended:** collapse into `src/app/features/*` + `shared/` + `data-access/` (one team, one deployment). Alternative: keep 2-3 real libs with enforced boundaries. | H / L |
| F2 | whole app | 51 components `standalone: false`; `bootstrapModule` + `provideZoneChangeDetection`; deprecated `BrowserAnimationsModule`/`@angular/animations`/`platform-browser-dynamic`; `provideHttpClient(withXhr(), withInterceptorsFromDi())` repeated in 3 modules; services both `providedIn: 'root'` and in module `providers`; stale `polyfills.ts`. | Standalone migration, `bootstrapApplication` with one `provideHttpClient(withFetch())`, drop `BackendApiModule`. | M / M-L |
| F3 | `environment.apiUrl + 'api/…'` ×~40 | Concatenation depends on trailing slash (prod has `/`, dev `''`). | `API_BASE_URL` token + interceptor/`ApiClient`. | M / M |
| F4 | `show-dashboard.component.ts` (445 lines) | God component: sorting, "already played/wished" logic, localStorage, timers, dialogs, 8 near-identical mutators (service call → snackbar → `loadRaces()` → `JSON.stringify(error)`); `BehaviorSubject`s exposed and read via `.value`. | `RaceListFacade`/store (`patchRace(race, patch, messages)`), pure `race-sorting.ts` + `song-played-info.ts` (also used by `song-search/input.component.ts`, which duplicates the logic differently), `RaceTable` presentational component (also for encore table), `RefreshControl`. Target < 150 lines. | M / M |
| F5 | types | `Show.date: Date` but arrives as ISO string; `Race.orderNumber: string` used in arithmetic (`element.orderNumber + 1` concatenates; lexicographic sort); id types inconsistent (`string` vs `number`, MQTT vs REST); `getCurrentShows()` returns `Observable \| undefined`; `.pipe(result => result)` no-op ×8; `songs$`/`users$` typed `never[]` and never updated; untyped `FormGroup` → `any` spread into `Race`; many `as Race/as never/!` casts. | Shared DTOs/OpenAPI types with the backend, typed reactive forms, one date mapper. | M / M |
| F6 | `create-show`/`edit-show`, `create-race`/`update-race` | ~90 % duplicated TS+HTML. | One `ShowFormComponent` / `RaceFormComponent` with `[value]` + `(submitted)`. | M / M |
| F7 | ~30 sites | `snackBar.open(\`…${JSON.stringify(error)}\`)` dumps `HttpErrorResponse` into the UI; some sites only `console.log` (no user feedback). | `NotificationService` + HTTP error interceptor (`error.error?.message ?? statusText`). | M / M |
| F8 | RxJS hygiene | 82 `.subscribe(` with almost no cleanup; nested subscribes without `switchMap` (`director-dashboard:31-43`, `shifts-dashboard:35-40`, `wizzard:35-40`, `upcomming-races:19-26`); `inject()` used once; `@Input()` everywhere; no `takeUntilDestroyed`. | `async`/`toSignal`/`takeUntilDestroyed`, `switchMap`. | M / M |
| F9 | imports | Three styles mixed (path alias, deep `../../../backend-api/...`, barrels); barrels pull whole modules for one symbol; cross-feature type imports (`BikeData` from the race-track component file). | Shared `models/` folder; ESLint `no-restricted-imports`. | L-M / S |
| F10 | styles | Parent-component selectors in `show-dashboard.component.scss:1-9` never match (emulated encapsulation) → `!important`; inline `style=""` in many templates; hard-coded hex colours while a full M3 palette exists; **two theming systems** (`indigo-pink.css` + M3 `button-theme`); deprecated Sass `@import`; component-style budget exceeded. | `mat.theme`/CSS tokens for race-state colours, shared table partial, drop `indigo-pink.css`. | L-M / S-M |
| F11 | naming | `UpdateRaceComponent` uses selector `lib-create-race`; both stats components `lib-songs`; `shift-from`/`shift-role-from`; typos `wizzard`, `upcomming` (API method `getUpcommingRace`), `staarting`, "Selecability"; prefix `lib` for app features. | Rename. | L / S |
| F12 | a11y | Icon-only buttons without accessible name (dashboard back/shifts/bike-won, 5 mini-FABs in state machine); clickable `<td [routerLink]>`; no `role="alert"` on the backend warning; warn text contrast ~3.7:1; several `h1`; `lang="en"` with German UI. | `aria-label`/tooltips, `<a>`, `role="alert"`, Material warn token, i18n/`lang`. | M / M |

---

## 8. Cross-cutting: tests, tooling, e2e, hardware

### Tests & tooling

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| T1 | `be/` | Coverage gaps exactly where the bugs are: `race.service` 48 %, `show.service` 68 %, broker only a single-race scenario, modules 0 %; unit tests with per-method Prisma mocks cannot catch FK-order, NaN or partial-update bugs. | DB-backed integration tests (e2e Postgres / Testcontainers) for writing services; cover `createRace`, `calculateRaceState`, `moveRacePosition`, `repairOrder`, `currentRace`, delete-show, consecutive races. | H / M |
| T2 | `be/` specs | Over-specified mocks (`jest.mock("fs")` with `mockReturnValueOnce` chains that enshrine the backup bug), controller specs restating the implementation (`data as any`); broker spec uses fixed ports 18830/18831, real 1 s timers, `waitForEvent` without timeout; `rest-api-lifecycle.e2e-spec` ends with a destructive import and has no guard against non-test DBs; `app.e2e-spec` tests "Hello World". | supertest + real DB, port `0`, fake timers, `if (!url.includes("_test")) throw`. | M / S-M |
| T3 | `ui/rl` | 51 of 59 specs are a single `should create`; 26 use `NO_ERRORS_SCHEMA` (hides invalid bindings/icons); 8 use deprecated `HttpClientTestingModule`; root `ng test` only includes `src/**/*.spec.ts` (= `app.component.spec`); lib tests are 18 separate targets not run by `npm test`; some libs have no test target; old jasmine ~4. | One `test` target covering `projects/**` + `src/**`; tests for sorting, played-info, transitions, `createBikeData`, countdown, polling-error path, `backup.service`. | M / M |
| T4 | `ui/rl/package.json` | `angular-eslint` pinned to 18.3.1 on Angular 22, eslint ^8; no `lint` architect target, no CI; `build:raspberry` identical to `build`; README is CLI 14 boilerplate. | Upgrade lint stack, enable `prefer-on-push-component-change-detection`, `prefer-standalone`, `prefer-inject`, `no-console`, `no-explicit-any`; CI job `lint && test && build`; real README. | M / S |
| T5 | 55 × `console.*` in FE | Noise; `stats/songs.component.ts` subscribes twice → HTTP call twice. | Remove / gated `Logger`, `no-console`. | L / S |

### e2e (Playwright)

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| E1 | `e2e/playwright.config.ts`, `docker-compose.e2e.yml` | Readiness gate only waits for the Angular dev server (4210); specs hit `:3010` / `mqtt://:3011` directly → first requests can get ECONNREFUSED while the backend still runs `db push` / `start:dev`. | Backend healthcheck in the e2e compose, `up --wait`, `webServer` array or `globalSetup` polling `/api/health`. | H / S |
| E2 | `songs.spec.ts`, `song-selectability.spec.ts` | Depend on the live internet (`songlist.ponytyler.de`); mutate every song (forces the `global-mutations` project ordering). | `SONGLIST_URL` env + a tiny stub container. | M / M |
| E3 | specs | `waitForTimeout(1500)` ×2, `waitUntil: 'networkidle'` ×~10 (fragile with polling UI), ~40 inline timeouts, per-file `setTimeout(120000)`. | Web-first assertions, central `expect.timeout` / `actionTimeout` / `navigationTimeout`. | M / S |
| E4 | `health-check.spec.ts:21` etc. | Vacuous assertions (`toHaveCount(0)` passes before the first health check resolves); icon ligature text as assertion; `toContainText('1')`; order assertions via `innerText().split('\n')[0]`; "move back down" asserts nothing. | `waitForResponse('**/api/health')` first, `aria-label`/`data-testid`. | M / S |
| E5 | selectors | German/English text mixed (`Speichern`, `Add Show`, `Stopp`), `.last()` patches, `nth(2)` on `td`, generated accessible names. | `data-testid`/stable roles; an i18n change breaks everything today. | M / M |
| E6 | specs | Helpers copied (`rowByText` ×3, `dismissSuccessSnackBar` ×3, `BACKEND_URL` ×5, create-show flow ×2, add-race flow ×3). | `tests/support/` with `test.extend` fixtures/page objects; ports from env. | M / S |
| E7 | specs | Serial UI-built state (`describe.serial`, shared page), data never cleaned, `fullyParallel` with global state, `retries: 0` locally. | Seed/cleanup via API per test. | M / M |
| E8 | config/docs | `reporter: 'html'` blocks on failure; v1 `docker-compose`; `--abort-on-container-exit`; `trace: on-first-retry` with `retries: 0`; README says "wait for healthy" (no checks), "containers remain" (script tears down), port 5433, "Node 18+"; `scripts/run-e2e-tests.sh` and Playwright `webServer` both own the lifecycle; `backend-rest-api.spec` duplicates `be/test/rest-api-lifecycle`. | Pick one lifecycle owner, `docker compose`, `html open: never`, `retain-on-failure`, dedupe. | L-M / S |

### Hardware & helper

| ID | Where | Problem | Proposal | Sev / Eff |
|---|---|---|---|---|
| X1 | `Arduino/goldsprint__v2.0_evo1.ino` | Publishes `rollentrainer/data` (`{pulses1,dist1,ts}`) to a fixed IP – **incompatible with the backend contract** (`Bike/N`, `{pulsecount, sequenz, timestamp}`, `Bike/N/cmd`); blocking `delay(1000)` countdown without `client.loop()` (keep-alive can drop); blocking reconnect and `Ethernet.begin`; torn reads of multi-byte ISR counters (no `noInterrupts()`); magic numbers (`3`, `100`, `723`, IP, MAC); dead code; `delayMicroseconds` in ISR. | Align topic/payload, `config.h`, millis-based state machine, atomic copies. | M / L |
| X2 | `goldsprint_v_10.ino`, `goldsprint tester.ino` | `delay(25)` per loop, `String` concatenation on AVR (heap fragmentation), non-`volatile` counters, magic reset bytes; tester: auto-repeat instead of edge detection, 600 ms blocking pulse train drops other buttons, serial print longer than the pulse. | Non-blocking scheduler, `volatile`, constants. | M / S-M |
| X3 | `Arduino/` | Sketches not in same-named folders (do not open in the IDE), inconsistent names, placeholder `readme.md`, duplicated ISR logic. | One folder per sketch, real README (board, libs, wiring, which sketch is current), `legacy/`. | M / M |
| X4 | `helper/fake-mqtt-signal-producer` | Image has no `bun install` (`node_modules` is dockerignored → `import mqtt` fails); `localhost:3001` hard-coded; compose maps unused `3000:3000`; `"start": "nest start"` without Nest; unused `aedes`, `net` stub; both `bun.lock` and `package-lock.json`; **`fakeRaceInterval = fakeRace()` overwrites the handle with `undefined` when one exists** (leak; re-triggered by its own `Bike/N/cmd`); counters never reset; unguarded `JSON.parse`; ~200 msg/s console spam; `consumer.ts` stale (wrong enum, unused topics). | Fix or delete; `MQTT_URL` env, `bun install`, single lockfile, drop dead files. | M / M |
| X5 | `README.md`, `DOCKER.md`, `.nvmrc` | Root README is stale (swa/prisma scripts, no Docker/e2e pointer); Node version inconsistent (26 vs 22 vs "18+" vs `@types/node ^20`); `DOCKER.md` port/command inaccuracies. | Single source of truth: Docker + `.nvmrc`. | L / S |

---

## 9. What is already done well

- **Backend:** active-state invariants for races/shows are encoded and unit-tested; state-change events only fire on actual change; import runs in one ordered transaction, resets Postgres sequences and rejects wrong `formatVersion`; export strips passwords and runs in parallel; `OnModuleDestroy` hooks exist for Prisma/MQTT/broker; `syncInProgress` + `ConflictException` guard pattern; `race-state.enum.ts` documents the circular-import fix; parameterised `Prisma.sql`; consistent Prettier/ESLint style.
- **Frontend:** `strict` + `strictTemplates`, no explicit `any`; `@if/@for` everywhere; `MQTT_CONNECT` is an `InjectionToken` (testable); health poll uses `catchError` in the inner pipe; behavioural specs for `ShowDashboard`, `StateMachine`, `MqttBroker`, `SongSync`, `AppComponent` use `fakeAsync`; multi-stage Docker build into nginx with SPA fallback.
- **Infra:** offline-bundle scripts use `set -euo pipefail`, quoting and `BASH_SOURCE`; e2e compose is properly isolated (distinct project name/ports, tmpfs Postgres); prod compose has healthchecks and `.env`-driven credentials; `.env` is gitignored, no real secrets committed.
- **e2e:** seed-via-API + UI only for what is under test, unique names, `expect.poll`, mostly `getByRole`, MQTT test with `try/finally`.

---

## 10. Proposed target architecture (short)

```
be/src/
  config/            typed, validated AppConfig (global)
  common/            ValidationPipe setup, exception filter, auth guard, logger
  show/ race/ song/ shift/ user/   controller + DTOs + service + repository (Prisma) per feature
  mqtt/
    broker-host.service.ts         Aedes lifecycle only
    mqtt-publisher.service.ts      in-process publish (no TCP self-connection)
    bike-race-tracker.ts           pure, unit-tested, resettable
    race-result-writer.service.ts
  import-export/  stats/  song-sync/
  (backup/ → removed or pg_dump sidecar)

ui/rl/src/app/
  core/              API_BASE_URL, interceptors (error, base-url), NotificationService, LiveUpdatesService (MQTT)
  data-access/       typed API services + shared models (generated from backend)
  features/          show/ race-control/ songs/ stats/ users/ views/   (standalone, lazy, OnPush, signals)
  shared/            ui components (button-list, message, countdown), pure helpers (race-sorting, song-played-info)
```

Deployment: one Postgres migration history, `migrate deploy` in the backend entrypoint, nginx proxying `/api` and `/mqtt-ws`, non-root slim images, pinned tags.

---

## 11. Working agreement for the fixes

1. **TDD** – every behavioural fix starts with a failing test (unit or DB-backed integration); for pure refactors, characterisation tests first.
2. One PR per finding group; suggested order: **Q1-Q14 → A4/A1/A6 → D1/J1/J2 → B3/B1/B2 → P5/P6 → F1/S1**.
3. Verification per PR: `cd be && npm test && npm run build`; `cd ui/rl && npm test && npm run build` (Node 26, see `.nvmrc`); e2e: `scripts/run-e2e-tests.sh`; for infra changes `docker compose -f docker-compose.prod.yml up --wait` must reach *healthy* on a fresh volume.
4. Before acting on any finding not marked ✔, re-read the cited code first – some items (A1, B6, Q9 template binding) depend on runtime/hardware behaviour.
