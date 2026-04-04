FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/uploads ./uploads

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001
CMD ["sh", "-c", "npm run prisma:migrate:prod && npm run start:prod"]
