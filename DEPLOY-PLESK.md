# Plesk Linux AMD64 deployment

The release package contains production build output but intentionally excludes `.env` and `node_modules`.

## Backend

1. Upload `backend/` to the backend Node.js application root.
2. Configure the Plesk environment variables from `backend/.env.example`, including a MariaDB `DATABASE_URL`.
3. Run `npm ci`, `npm run prisma:switch:mariadb`, and `npm run prisma:generate`.
4. Run `npm run prisma:push` against the new UOM MariaDB database, then run `npm prune --omit=dev`.
5. Start with `node dist/src/main.js`.

## Frontend

1. Upload the contents of `frontend/` to the frontend Node.js application root.
2. Configure `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_IMAGE_BASE_URL=https://images.uomarchive.com`, and the other variables from `frontend/.env.example`.
3. Start with `node server.js`.

The frontend is built with Next.js standalone output. Do not upload the repository `node_modules`; install dependencies on the Linux server when the Plesk application requires them.
