#!/usr/bin/env sh
set -eu

APP_NAME="${APP_NAME:-uom-frontend}"
APP_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUNTIME_DIR="${APP_ROOT}/.runtime"
LOG_DIR="${APP_ROOT}/logs"
PID_FILE="${PID_FILE:-${RUNTIME_DIR}/${APP_NAME}.pid}"
LOCK_DIR="${LOCK_DIR:-${RUNTIME_DIR}/${APP_NAME}.lock}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/${APP_NAME}.log}"
STANDALONE_DIR="${STANDALONE_DIR:-${APP_ROOT}/.next/standalone}"
NODE_ENTRY="${NODE_ENTRY:-server.js}"
RESTART_DELAY_SECONDS="${RESTART_DELAY_SECONDS:-3}"
LOCK_TTL_SECONDS="${LOCK_TTL_SECONDS:-60}"
AUTO_RESTART="${AUTO_RESTART:-${UOM_AUTO_RESTART:-0}}"
FORCE_RESTART="${FORCE_RESTART:-${UOM_RESTART:-0}}"

mkdir -p "$RUNTIME_DIR" "$LOG_DIR"

usage() {
  echo "Usage: $0 <start|stop|restart|status>"
}

is_running() {
  [ -f "$PID_FILE" ] || return 1
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  case "$pid" in
    ''|*[!0-9]*)
      rm -f "$PID_FILE"
      return 1
      ;;
  esac
  kill -0 "$pid" 2>/dev/null
}

with_lock() {
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    created_at="$(cat "${LOCK_DIR}/created_at" 2>/dev/null || echo 0)"
    now="$(date +%s 2>/dev/null || echo 0)"
    age=$((now - created_at))
    if [ "$created_at" -gt 0 ] 2>/dev/null && [ "$age" -gt "$LOCK_TTL_SECONDS" ]; then
      rm -f "${LOCK_DIR}/created_at" 2>/dev/null || true
      rmdir "$LOCK_DIR" 2>/dev/null || true
      mkdir "$LOCK_DIR" 2>/dev/null || {
        echo "$APP_NAME lock exists. Another operation may be running: $LOCK_DIR" >&2
        exit 1
      }
    else
      echo "$APP_NAME lock exists. Another operation may be running: $LOCK_DIR" >&2
      exit 1
    fi
  fi
  date +%s >"${LOCK_DIR}/created_at" 2>/dev/null || true
  if [ -f "$PID_FILE" ] && ! is_running; then
    rm -f "$PID_FILE"
  fi
  trap 'rm -f "${LOCK_DIR}/created_at" 2>/dev/null || true; rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM
}

prepare_standalone() {
  (cd "$APP_ROOT" && node scripts/prepare-standalone.mjs)
}

start_app() {
  with_lock

  if is_running; then
    if [ "$FORCE_RESTART" = "1" ]; then
      stop_app
    else
      echo "$APP_NAME already running with PID $(cat "$PID_FILE")."
      return
    fi
  fi

  prepare_standalone

  if [ ! -f "${STANDALONE_DIR}/${NODE_ENTRY}" ]; then
    echo "Missing ${NODE_ENTRY}. Run npm run build first." >&2
    exit 1
  fi

  export NODE_ENV="${NODE_ENV:-production}"
  export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=384}"
  export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-4}"

  if [ "$AUTO_RESTART" = "1" ]; then
    nohup sh -c '
      cd "$1"
      child=""
      stop_child() {
        if [ -n "$child" ] && kill -0 "$child" 2>/dev/null; then
          kill "$child" 2>/dev/null || true
          wait "$child" 2>/dev/null || true
        fi
        exit 0
      }
      trap stop_child INT TERM
      while :; do
        node "$2" &
        child="$!"
        wait "$child"
        code="$?"
        child=""
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $3 exited with code $code" >&2
        sleep "$4"
      done
    ' sh "$STANDALONE_DIR" "$NODE_ENTRY" "$APP_NAME" "$RESTART_DELAY_SECONDS" >>"$LOG_FILE" 2>&1 &
  else
    nohup sh -c 'cd "$1" && exec node "$2"' sh "$STANDALONE_DIR" "$NODE_ENTRY" >>"$LOG_FILE" 2>&1 &
  fi

  echo "$!" >"$PID_FILE"
  echo "$APP_NAME started with PID $(cat "$PID_FILE"). Log: $LOG_FILE"
}

stop_app() {
  if ! is_running; then
    rm -f "$PID_FILE"
    echo "$APP_NAME is not running."
    return
  fi

  pid="$(cat "$PID_FILE")"
  kill "$pid" 2>/dev/null || true

  timeout="${STOP_TIMEOUT_SECONDS:-20}"
  while kill -0 "$pid" 2>/dev/null && [ "$timeout" -gt 0 ]; do
    sleep 1
    timeout=$((timeout - 1))
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "$APP_NAME stopped."
}

status_app() {
  if is_running; then
    echo "$APP_NAME running with PID $(cat "$PID_FILE")."
  else
    echo "$APP_NAME is not running."
    return 1
  fi
}

cmd="${1:-}"
case "$cmd" in
  start) start_app ;;
  stop) stop_app ;;
  restart)
    FORCE_RESTART=1
    start_app
    ;;
  status) status_app ;;
  *)
    usage
    exit 1
    ;;
esac
