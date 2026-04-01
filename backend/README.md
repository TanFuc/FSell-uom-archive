# Ươm Archive Backend

NestJS REST API for the Ươm Archive e-commerce platform.

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript (Strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Authentication:** JWT (Access + Refresh tokens)
- **Documentation:** Swagger/OpenAPI
- **File Upload:** Multer + Sharp

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm

### 1. Start Database Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

### 5. Seed Database

```bash
npm run db:seed
```

### 6. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`

## API Documentation

Swagger UI: `http://localhost:3001/api/docs`

## Default Admin Credentials

- **Email:** admin@uomarchive.com
- **Password:** admin123

**Important:** Change the password in production!

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `FRONTEND_URL` - Frontend URL for CORS

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run monitoring:up` | Start Prometheus + Grafana |
| `npm run monitoring:down` | Stop monitoring stack |

## Monitoring

### Built-in endpoints

- `GET /api/monitoring/health` - app + database + redis health status
- `GET /api/monitoring/metrics` - Prometheus metrics endpoint

### Start Prometheus + Grafana

From the `backend` folder:

```bash
npm run monitoring:up
```

Services:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002` (default login: `admin` / `admin`)

Prometheus scrapes backend metrics from:

- `http://host.docker.internal:3001/api/monitoring/metrics`

### Dashboard and Alerts

- Grafana dashboard (auto-provisioned): `UOM Backend - API Overview`
	- HTTP RPS
	- p95 latency
	- 5xx error rate
	- in-flight requests
- Prometheus alert rules (auto-loaded from `monitoring/alerts.yml`):
	- `UomBackendHealthDown`
	- `UomHighHttpErrorRate`
	- `UomHighP95Latency`

Grafana Alerting provisioning file:

- `monitoring/grafana/provisioning/alerting/contact-points-policies.yml`
- `monitoring/grafana/provisioning/alerting/managed-alert-rules.yml`

Configured contact points:

- Telegram: `telegram-critical`
- Slack: `slack-warning`
- Email: `email-default`

Notification policy routing:

- `severity=critical` -> Telegram + Email
- `severity=warning` -> Slack + Email
- Other alerts -> Email

Managed alert rules in Grafana (not dependent on Prometheus Alerts UI):

- `UOM Backend Health Down`
- `UOM High HTTP Error Rate`
- `UOM High P95 Latency`
- `UOM Synthetic Notify Test` (fires for ~3 minutes after backend start, then auto-resolves)

Set these environment variables before `npm run monitoring:up`:

- `GF_ALERT_TELEGRAM_BOT_TOKEN`
- `GF_ALERT_TELEGRAM_CHAT_ID`
- `GF_ALERT_SLACK_WEBHOOK_URL`
- `GF_ALERT_EMAIL_ADDRESSES`
- `GF_SMTP_ENABLED=true`
- `GF_SMTP_HOST`, `GF_SMTP_USER`, `GF_SMTP_PASSWORD`
- `GF_SMTP_FROM_ADDRESS`, `GF_SMTP_FROM_NAME`

To inspect managed alert states:

- Grafana Alerting UI: `http://localhost:3002/alerting`

To re-run synthetic end-to-end notification test:

1. Restart backend service/app.
2. Wait about 10-30s for evaluation.
3. Confirm `UOM Synthetic Notify Test` enters firing state and sends notifications.
4. Confirm it auto-resolves after ~3 minutes.

## Project Structure

```
src/
├── auth/           # Authentication (JWT, guards, strategies)
├── products/       # Product management
├── orders/         # Order management
├── settings/       # Site settings (theme, content, notifications)
├── upload/         # File upload service
├── notifications/  # Email, Zalo, Facebook notifications
├── prisma/         # Database service
├── redis/          # Cache service
└── common/         # Filters, interceptors, pipes
```

## API Endpoints

### Public Endpoints
- `GET /api/products` - List products
- `GET /api/products/:slug` - Get product by slug
- `POST /api/orders` - Create order (guest checkout)
- `GET /api/orders/number/:orderNumber` - Track order
- `GET /api/settings/theme` - Get theme settings
- `GET /api/settings/site-content` - Get site content
- `GET /api/settings/exchange-rate` - Get exchange rate

### Admin Endpoints (require JWT)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - List all orders
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/settings/theme` - Update theme
- `PUT /api/settings/notifications` - Update notification settings
- `POST /api/upload/product-image` - Upload image

## Notifications

Configure in Admin Dashboard > Settings:

1. **Email** - SMTP settings (Gmail, SendGrid, etc.)
2. **Zalo** - Zalo OA credentials
3. **Facebook** - Page access token

See `NOTIFICATION-GUIDE.md` for detailed setup instructions.

## Production Deployment

```bash
# Build
npm run build

# Run migrations
npm run prisma:migrate:prod

# Seed (first time only)
npm run db:seed

# Start
npm run start:prod
```

## License

Private - All rights reserved.
