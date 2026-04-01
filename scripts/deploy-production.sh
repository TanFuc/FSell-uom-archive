#!/usr/bin/env sh
set -eu

SKIP_BUILD=0
SKIP_SEED=0
BACKEND_HEALTH_TIMEOUT_SECONDS="${BACKEND_HEALTH_TIMEOUT_SECONDS:-180}"

for arg in "$@"; do
  case "$arg" in
    --skip-build)
      SKIP_BUILD=1
      ;;
    --skip-seed)
      SKIP_SEED=1
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: ./scripts/deploy-production.sh [--skip-build] [--skip-seed]" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.prod.yml"
ENV_FILE="$REPO_ROOT/.env.prod"

step() {
  echo "\n==> $1"
}

wait_backend_healthy() {
  container_id="$(docker compose -f "$COMPOSE_FILE" ps -q backend | tr -d '\r')"
  if [ -z "$container_id" ]; then
    echo "Could not find backend container ID" >&2
    exit 1
  fi

  start_ts="$(date +%s)"
  while true; do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" | tr -d '\r')"

    if [ "$health" = "healthy" ]; then
      echo "Backend is healthy."
      return
    fi

    if [ "$health" = "unhealthy" ]; then
      echo "Backend became unhealthy while waiting for readiness." >&2
      exit 1
    fi

    now_ts="$(date +%s)"
    elapsed=$((now_ts - start_ts))
    if [ "$elapsed" -ge "$BACKEND_HEALTH_TIMEOUT_SECONDS" ]; then
      echo "Timed out waiting for backend health after ${BACKEND_HEALTH_TIMEOUT_SECONDS}s" >&2
      exit 1
    fi

    sleep 3
  done
}

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env.prod at '$ENV_FILE'. Create it from .env.prod.example first." >&2
  exit 1
fi

cd "$REPO_ROOT"

step "Validate docker compose file"
docker compose -f "$COMPOSE_FILE" config >/dev/null

if [ "$SKIP_BUILD" -eq 0 ]; then
  step "Build backend and frontend images"
  docker compose -f "$COMPOSE_FILE" build backend frontend
fi

step "Start postgres and redis first"
docker compose -f "$COMPOSE_FILE" up -d postgres redis

step "Run database migrations"
docker compose -f "$COMPOSE_FILE" run --rm backend npm run prisma:migrate:prod

step "Start backend and wait until healthy"
docker compose -f "$COMPOSE_FILE" up -d backend
wait_backend_healthy

if [ "$SKIP_SEED" -eq 0 ]; then
  step "Run database seed"
  docker compose -f "$COMPOSE_FILE" exec -T backend npm run db:seed
fi

step "Start frontend"
docker compose -f "$COMPOSE_FILE" up -d frontend

step "Current service status"
docker compose -f "$COMPOSE_FILE" ps

echo "\nProduction deploy completed successfully."
