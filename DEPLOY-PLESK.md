# Deploy FSell UOM Archive on Plesk/Passenger

The two applications must be registered as two separate Plesk Node.js apps. Passenger owns the public sockets and injects a private `PORT` into each process. Do **not** add `PORT` to Plesk custom environment variables.

## Build and restart

From the repository root, after installing dependencies and configuring build-time environment variables:

```sh
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm run deploy:plesk
```

`deploy-plesk.js` builds `backend/dist`, builds the Next.js standalone server, copies `.next/static` and `public` into `.next/standalone`, and updates both `tmp/restart.txt` files. A failed build exits non-zero and does not trigger either Passenger restart.

For the first backend deployment, also run the database preparation appropriate to the selected Prisma provider before restarting:

```sh
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:push
```

Build on the Linux host when native dependencies such as Prisma or Sharp are part of the artifact. Do not upload Windows `node_modules` to Plesk.

## Plesk Node.js Dashboard mapping

Assuming the repository is under `httpdocs/FSell-uom-archive`:

| Dashboard field | Backend app | Frontend app |
| --- | --- | --- |
| Node.js version | `24.x` | `24.x` |
| Application mode | `Production` | `Production` |
| Application Root | `httpdocs/FSell-uom-archive/backend` | `httpdocs/FSell-uom-archive/frontend` |
| Document Root | `httpdocs/FSell-uom-archive/backend/public` | `httpdocs/FSell-uom-archive/frontend/public` |
| Application URL | `https://api.uomarchive.com` | `https://www.uomarchive.com` |
| Startup File | `passenger-backend.js` | `passenger-frontend.js` |

The startup filename is relative to Application Root; do not enter an absolute path and do not use `npm start`, `next start`, `scripts/start-standalone.mjs`, PM2, or a fixed port.

If the Plesk version allows Document Root to equal Application Root, the root `.htaccess` files are sufficient. With the safer `public` Document Roots shown above, the mirrored `public/.htaccess` files are the ones Apache reads. Keeping source, `.env`, and build metadata outside Document Root prevents direct downloads.

Recommended backend custom variables:

```txt
NODE_ENV=production
UV_THREADPOOL_SIZE=1
NODE_OPTIONS=--max-old-space-size=256 --v8-pool-size=1
SHARP_CONCURRENCY=1
REQUEST_LOGGING_ENABLED=false
METRICS_ENABLED=false
DATABASE_URL=mysql://...
FRONTEND_URL=https://www.uomarchive.com
```

Recommended frontend custom variables (set these before `next build` as well as at runtime):

```txt
NODE_ENV=production
UV_THREADPOOL_SIZE=1
NODE_OPTIONS=--max-old-space-size=256 --v8-pool-size=1
NEXT_PRIVATE_WORKER_THREADS=0
NEXT_PRIVATE_MINIMAL_MODE=1
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_BASE_URL=https://api.uomarchive.com
NEXT_PUBLIC_API_URL=https://api.uomarchive.com
SERVER_API_URL=https://api.uomarchive.com
SITEMAP_API_URL=https://api.uomarchive.com
NEXT_PUBLIC_IMAGE_BASE_URL=https://images.uomarchive.com
NEXT_PUBLIC_APP_URL=https://www.uomarchive.com
```

After saving each dashboard configuration, click **NPM Install** if needed and then **Restart App**. Later deployments can use `npm run deploy:plesk`; touching `tmp/restart.txt` is Passenger's blocking restart trigger.

## Passenger process limits

Each app `.htaccess` sets the per-application cap with:

```apache
PassengerMinInstances 1
PassengerMaxInstances 1
PassengerForceMaxConcurrentRequestsPerProcess 0
```

`PassengerMaxInstances 1` is the setting that prevents Passenger from scaling one app to multiple Node processes. `PassengerForceMaxConcurrentRequestsPerProcess 0` tells Passenger that the event-driven Node process can accept concurrent requests.

`PassengerMaxPoolSize 1` is intentionally not placed in `.htaccess`: it is a server-wide Apache directive, is invalid in `.htaccess`, and a global value of 1 would allow only one process total for both services. If you control Apache, use `PassengerMaxPoolSize 2` in server configuration (one backend plus one frontend). On shared hosting, ask the provider to set a pool size of at least 2 and retain `PassengerMaxInstances 1` for each app. Some Passenger Community builds do not support the per-app `PassengerMaxInstances` feature; in that case the hosting provider must enforce `PassengerMaxInstancesPerApp 1` or equivalent in server configuration.

`PassengerPoolIdleTime` is also documented as server-config-only on recent Passenger versions, so the `.htaccess` files leave it as an explanatory comment. Ask the provider to set `PassengerPoolIdleTime 0` globally. `PassengerMinInstances 1` keeps the warm instance in the normal Plesk configuration.

## Routing modes

The committed configuration assumes separate subdomains: `www.uomarchive.com` for Next.js and `api.uomarchive.com` for NestJS. Apache serves `/_next/static/*` directly from the prepared assets; all other requests go to Passenger.

For a same-domain deployment, configure `mod_proxy` in Plesk **Apache & nginx Settings** before the Passenger fallback:

```apache
RewriteEngine On
RewriteRule ^api/(.*)$ https://api.uomarchive.com/$1 [P,L]
```

Do not enable that blanket rule in this repository as-is: the frontend currently owns Next route handlers under `/api/revalidate`, `/api/seo/revalidate`, and `/api/seo/ping`. Either exclude those paths or move the NestJS proxy to a non-conflicting prefix such as `/backend-api/`.

## Diagnostics

Use these read-only checks through SSH:

```sh
ps -u "$USER" -o pid,ppid,nlwp,comm,args --sort=-nlwp
tail -n 200 ~/logs/*error* 2>/dev/null
```

If a worker reports `EADDRINUSE`, verify that `PORT` is absent from both Plesk custom variables and `.env`. Both wrappers reject a missing/invalid Passenger port and never start a child process or cluster.
