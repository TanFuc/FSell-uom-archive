#!/usr/bin/env bash
set -euo pipefail

docker exec -i uom_mariadb sh <<'CONTAINER'
export MYSQL_PWD="$MARIADB_PASSWORD"
mariadb -u "$MARIADB_USER" "$MARIADB_DATABASE" -N <<'SQL'
SELECT DATABASE(), VERSION();
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE();
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '_prisma_migrations';
SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name;
SQL
CONTAINER
