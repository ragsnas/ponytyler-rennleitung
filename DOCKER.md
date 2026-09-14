# Docker Setup Guide

This project includes Docker Compose configurations for both development and production environments with two application services: NestJS Backend (which also hosts the embedded MQTT broker) and Angular Frontend.

## Services

- **Backend** (NestJS): Port 3000 (HTTP API) and Port 3001 (embedded MQTT broker, see `be/src/mqtt/README.md`)
- **Frontend** (Angular): Port 80 (prod) / 4200 (dev)
- **PostgreSQL**: Port 5432 (development only, exposed)

## Development Setup

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)

### Running Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose up --build
```

### Development Features
- **Hot Reload**: Code changes automatically reload in Angular and NestJS
- **Volume Mounts**: All source code mounted as volumes for live editing
- **Database**: PostgreSQL included with persistent data
- **Debugging**: Ports exposed for browser debugging and IDE debuggers

### Accessing Services (Development)
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- MQTT Broker (embedded in backend): mqtt://localhost:3001
- PostgreSQL: localhost:5432

## Production Setup

### Running Production Environment

```bash
# Create .env file from template
cp .env.example .env

# Edit .env with production values
nano .env

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Production Features
- **Multi-stage Builds**: Smaller Docker images
- **Health Checks**: Services monitor their own health
- **Auto-restart**: Services automatically restart on failure
- **Environment Variables**: Secure configuration via .env
- **Database**: PostgreSQL with persistent volumes
- **No Hot Reload**: Optimized for performance and stability

### Environment Variables (Production)
Create a `.env` file in the project root:

```env
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=ponytyler

# Node Environment
NODE_ENV=production

# MQTT Broker port (embedded in the backend)
MQTT_PORT=3001
```

### Accessing Services (Production)
- Frontend: http://localhost or http://your-domain.com
- Backend API: http://localhost:3000
- MQTT Broker (embedded in backend): mqtt://localhost:3001
- PostgreSQL: Not exposed (internal only)

## Docker Images

### Custom Dockerfiles

#### Frontend (`ui/rl/Dockerfile.dev`)
- Node 18 Alpine
- Runs Angular dev server with watch mode
- Exposes port 4200

#### Frontend (`ui/rl/Dockerfile.prod`)
- Multi-stage: Builder stage compiles Angular, Production stage serves via Nginx
- Alpine-based Nginx for minimal footprint
- Exposes port 80

#### Backend (`be/Dockerfile` / `be/Dockerfile.prod`)
- Node 20 Alpine
- Development: Uses existing Dockerfile with npm install and build
- Production: Multi-stage build, production dependencies only, Prisma schema generation
- Hosts the embedded MQTT broker (Aedes) alongside the HTTP API — see `be/src/mqtt/README.md`
- Exposes ports 3000 (HTTP) and 3001 (MQTT)

## Common Commands

```bash
# Development
docker-compose up -d              # Start services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend npm test  # Run backend tests
docker-compose down -v            # Stop and remove volumes

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps        # View status
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml down
```

## Networking

Both configurations use a custom network `ponytyler-network` for service-to-service communication. Services can communicate using their container names as hostnames (e.g., `mqtt://backend:3001` for the embedded MQTT broker).

## Database Management

### Development
Database is accessible from host via `localhost:5432`. Use any PostgreSQL client to connect.

### Production
Database is not exposed to the host. Access via:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d ponytyler
```

## Troubleshooting

### Services won't start
```bash
# Check Docker logs
docker-compose logs backend   # includes MQTT broker logs
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Database connection issues
- Verify DATABASE_URL environment variable is correct
- Check PostgreSQL is running: `docker-compose ps`
- In production, verify .env file is properly configured

### Port conflicts
If ports are already in use:
- Development: Change ports in `docker-compose.yml` (e.g., `4201:4200`)
- Production: Change ports in `docker-compose.prod.yml`

### Memory/performance issues
- Increase Docker resources in Docker Desktop settings
- Use `docker system prune` to clean up unused images/containers
- For large projects, consider using BuildKit: `DOCKER_BUILDKIT=1 docker-compose build`

## E2E Test Stack

`docker-compose.e2e.yml` is a stack dedicated to the Playwright suite in
`e2e/` — see `e2e/README.md` for details. It's isolated from the dev stack
above (own container names, network, and host ports: frontend `4210`,
backend `3010`/`3011`, postgres `5433`) so both can run at the same time, and
its Postgres data lives in `tmpfs` so every run starts empty. Playwright
starts and tears it down automatically via `npm test` in `e2e/`; to drive it
by hand:

```bash
cd e2e
npm run docker:up    # build and start, foreground
npm run docker:down  # stop and remove containers + volumes
```

## Offline / Raspberry Pi deployment

For a Raspberry Pi (or any host) with **no internet access**, images can't be
built or pulled on the target — everything has to arrive pre-built. The
`docker-compose.prod.yml` services carry both a `build` and a fixed `image`
tag (`ponytyler/backend:prod`, `ponytyler/frontend:prod`); when an image with
that tag already exists locally, `docker compose up` uses it as-is and never
tries to build or pull, which is exactly what makes this work offline.

Requirements:
- A machine with internet and Docker Buildx (used to cross-build for the
  Pi's arm64 CPU) — this repo checkout is enough.
- Docker + the compose plugin already installed on the Pi itself. Installing
  Docker offline is out of scope here; do that once beforehand while the Pi
  still has (or briefly borrows) connectivity.

### 1. Build the bundle (on the machine with internet)

```bash
./scripts/build-offline-bundle.sh
```

This cross-builds the backend and frontend prod images for `linux/arm64`
(Pi 4/5, 64-bit OS), pulls the matching `postgres:15-alpine`, and writes
everything needed into `offline-bundle/`:
- `images-arm64.tar` — all three images (`docker save`)
- `docker-compose.prod.yml`
- `.env.example`
- `load-offline-bundle.sh`

If `docker buildx build --platform linux/arm64` fails with an exec-format
error, arm64 emulation isn't registered yet — run once:
```bash
docker run --privileged --rm tonistiigi/binfmt --install arm64
```

### 2. Copy to the Pi

Copy the whole `offline-bundle/` folder onto a USB drive, then onto the Pi
(e.g. under `~/ponytyler`).

### 3. Load and start (on the Pi, no internet needed)

```bash
cd ~/ponytyler
./load-offline-bundle.sh
```

First run: it has no `.env` yet, so it copies `.env.example` to `.env` and
stops — edit `.env` with real production values (DB password, etc.), then
run it again. The second run loads the images (`docker load`), starts the
stack with `docker compose -f docker-compose.prod.yml up -d` (no build), and
runs `prisma migrate deploy` against the fresh database.

### Updating later

Repeat step 1 whenever backend/frontend code changes, then re-copy just the
new `images-arm64.tar` to the Pi and run:
```bash
docker load -i images-arm64.tar
docker compose -f docker-compose.prod.yml up -d
```
(`up -d` recreates only the containers whose image actually changed.)
