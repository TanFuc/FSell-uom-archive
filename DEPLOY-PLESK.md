# Plesk Linux AMD64 deployment

The release package contains production build output but intentionally excludes `.env` and `node_modules`.

## Backend

1. Upload `backend/` to the backend Node.js application root.
2. Configure the Plesk environment variables from `backend/.env.example`, including a MariaDB `DATABASE_URL`.
3. Run `npm ci`, `npm run prisma:switch:mariadb`, and `npm run prisma:generate`.
4. Run `npm run prisma:push` against the new UOM MariaDB database, then run `npm prune --omit=dev`.
5. In Plesk Node.js, use startup file `dist/src/main.js` and Restart App.

## Frontend

1. Upload the contents of `frontend/` to the frontend Node.js application root.
2. Configure `NEXT_PUBLIC_API_BASE_URL=https://api.uomarchive.com/api`, `NEXT_PUBLIC_API_URL=https://api.uomarchive.com/api`, `SERVER_API_URL=https://api.uomarchive.com/api`, `SITEMAP_API_URL=https://api.uomarchive.com/api`, `NEXT_PUBLIC_IMAGE_BASE_URL=https://images.uomarchive.com`, and the other variables from `frontend/.env.example` before building.
3. In Plesk Node.js, use startup file `scripts/start-standalone.mjs` and Restart App.

## Nohup process control

For the lowest process count, use the Plesk Node.js startup files above: one Node process for backend and one Node process for frontend. The `nohup` runner is only a SSH fallback when Plesk cannot supervise the app directly. It includes PID files, stale PID cleanup, and duplicate-start protection:

```sh
npm run nohup:start
npm run nohup:status
npm run nohup:restart
npm run nohup:stop
```

Set `UOM_RESTART=1` when a deployment should replace an already-running process during `nohup:start`.
Set `UOM_AUTO_RESTART=1` only if Plesk is not already supervising the Node app; it keeps a small shell supervisor alive so the app restarts after a crash. Leave it unset for the lowest process count.

The frontend is built with Next.js standalone output. Do not upload the repository `node_modules`; install dependencies on the Linux server when the Plesk application requires them.
