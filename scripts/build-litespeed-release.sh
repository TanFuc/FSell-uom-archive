#!/usr/bin/env bash
set -euo pipefail

workspace="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node_home="${UOM_NODE_HOME:-/tmp/uom-node24-build/node-v24.19.0-linux-x64}"
target="${1:-all}"

if [[ "$target" != "all" && "$target" != "frontend" && "$target" != "backend" ]]; then
  echo "Usage: $0 [all|frontend|backend]" >&2
  exit 1
fi

if [[ ! -x "$node_home/bin/node" ]]; then
  echo "Node.js Linux runtime not found at $node_home" >&2
  exit 1
fi

export PATH="$node_home/bin:$PATH"
build_root="$(mktemp -d /tmp/uom-litespeed-release-XXXXXX)"
trap 'rm -rf -- "$build_root"' EXIT

mkdir -p "$build_root/source" "$build_root/frontend-package" "$build_root/backend-package"
tar \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='release' \
  -C "$workspace" \
  -cf - frontend backend | tar -C "$build_root/source" -xf -

frontend="$build_root/source/frontend"
backend="$build_root/source/backend"

if [[ "$target" == "all" || "$target" == "backend" ]]; then
  echo "Installing and building backend with $(node --version)..."
  npm --prefix "$backend" ci --no-audit --no-fund
  npm --prefix "$backend" run build
  npm --prefix "$backend" prune --omit=dev --no-audit --no-fund
fi

if [[ "$target" == "all" || "$target" == "frontend" ]]; then
  echo "Installing and building frontend with $(node --version)..."
  npm --prefix "$frontend" ci --no-audit --no-fund
  npm --prefix "$frontend" run build
fi

frontend_package="$build_root/frontend-package"
backend_package="$build_root/backend-package"

if [[ "$target" == "all" || "$target" == "frontend" ]]; then
  cp "$frontend/.htaccess" "$frontend/litespeed-entry.js" "$frontend/.env.example" \
    "$frontend/package.json" "$frontend/package-lock.json" "$frontend/next.config.js" \
    "$frontend_package/"
  cp -a "$frontend/.next" "$frontend/public" "$frontend_package/"
  mkdir -p "$frontend_package/tmp"
  date -Iseconds > "$frontend_package/tmp/restart.txt"
fi

if [[ "$target" == "all" || "$target" == "backend" ]]; then
  cp "$backend/.htaccess" "$backend/litespeed-entry.js" "$backend/.env.example" \
    "$backend/package.json" "$backend/package-lock.json" "$backend_package/"
  cp -a "$backend/dist" "$backend/node_modules" "$backend/prisma" "$backend_package/"
  mkdir -p "$backend_package/tmp"
  date -Iseconds > "$backend_package/tmp/restart.txt"
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
release_dir="$workspace/release"
frontend_archive="$release_dir/uom-archive-frontend-litespeed-linux-deps-$timestamp.tar.gz"
backend_archive="$release_dir/uom-archive-backend-litespeed-linux-deps-$timestamp.tar.gz"

mkdir -p "$release_dir"
archives=()

if [[ "$target" == "all" || "$target" == "frontend" ]]; then
  tar -C "$frontend_package" -czf "$frontend_archive" .
  archives+=("$frontend_archive")
fi

if [[ "$target" == "all" || "$target" == "backend" ]]; then
  tar -C "$backend_package" -czf "$backend_archive" .
  archives+=("$backend_archive")
fi

sha256sum "${archives[@]}"
du -h "${archives[@]}"
