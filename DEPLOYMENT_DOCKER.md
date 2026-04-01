# Docker Deployment

## Local Docker Setup (Full Stack)

This repository now includes a root `docker-compose.yml` for local full-stack run:

- Frontend
- Backend
- PostgreSQL
- Redis
- Optional monitoring stack (Prometheus + Grafana)

### 1) Prepare local env

From repository root:

```bash
cp .env.docker.example .env.docker
```

Update secrets and URLs as needed in `.env.docker`.

### 2) Run full stack

```bash
npm run docker:up
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- API Docs (dev only): `http://localhost:3001/api/docs`

### 3) Run monitoring profile

```bash
npm run docker:monitoring:up
```

Monitoring endpoints:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002`

### 4) Stop local stack

```bash
npm run docker:down
```

### 5) View logs

```bash
npm run docker:logs
```

## Production Docker Deployment

This project can run fully in containers with one command.

## 1) Prepare production env

Create `.env.prod` from the example at repository root:

```bash
cp .env.prod.example .env.prod
```

Update all secrets before running in production:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- Cloudinary credentials

## 1.1) One-shot deploy script (recommended)

From repository root:

```bash
npm run deploy:prod
```

Linux server:

```bash
chmod +x ./scripts/deploy-production.sh
npm run deploy:prod:linux
```

This script runs the full flow in order:
1. Validate compose config
2. Build backend + frontend images
3. Start postgres + redis
4. Run Prisma migrate deploy
5. Start backend and wait for backend healthcheck = healthy
6. Run DB seed
7. Start frontend
7. Show final service status

Optional variants:

```bash
npm run deploy:prod:skip-build
npm run deploy:prod:skip-seed
npm run deploy:prod:linux:skip-build
npm run deploy:prod:linux:skip-seed
```

## 2) Build and run

From the repository root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Build/run separately if needed:

```bash
# Build only backend image
docker compose -f docker-compose.prod.yml build backend

# Build only frontend image
docker compose -f docker-compose.prod.yml build frontend

# Run only backend service (with required dependencies)
docker compose -f docker-compose.prod.yml up -d --build backend

# Run only frontend service
docker compose -f docker-compose.prod.yml up -d --build frontend
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger (disabled in production by code)

## 2) Stop

```bash
docker compose -f docker-compose.prod.yml down
```

## 3) Logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 4) First-time setup notes

- Database migrations run automatically in backend container startup.
- Containers run as non-root with dropped capabilities.
- Backend CORS is strict in production using `FRONTEND_URLS`.

## 5) Rebuild after code changes

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Or rebuild a single service:

```bash
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## 6) Optional: reset all data

```bash
docker compose -f docker-compose.prod.yml down -v
```

This deletes postgres/redis volumes.

## 7) Image upload provider (Cloudflare R2)

Backend now supports `UPLOAD_PROVIDER=r2` using S3-compatible API.

Required env values:
- `R2_ENDPOINT` (example: `https://<account-id>.r2.cloudflarestorage.com`)
- `R2_KEY`
- `R2_SECRET`
- `R2_BUCKET`
- `R2_PUBLIC_URL` (example CDN/domain base URL)

Upload pipeline optimization:
- auto-rotate from EXIF
- resize to max 1600x1600 (no enlargement)
- Lanczos3 resampling for quality
- sharpen filter for better perceived detail
- convert to WebP (`quality=88`, `effort=6`)
