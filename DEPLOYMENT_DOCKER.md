# Production Docker Deployment

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

## 2) Build and run

From the repository root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
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
