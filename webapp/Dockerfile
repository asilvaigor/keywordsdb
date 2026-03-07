# Build stage
FROM node:24.13-slim AS builder

WORKDIR /app

RUN npm install --global bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY app app
COPY components components
COPY lib lib
COPY public public
COPY content content
COPY next.config.ts components.json tsconfig.json postcss.config.mjs instrumentation-client.ts ./

ARG ENV
ENV NEXT_PUBLIC_ENV=$ENV
ENV NODE_ENV=production
ENV HOME=/app

RUN bun run build

# Install DuckDB extensions
RUN node -e "\
        import { DuckDBConnection } from '@duckdb/node-api'; \
        const db = await DuckDBConnection.create(); \
        await db.run('INSTALL httpfs'); \
"

# Runner stage
FROM node:24.13-slim AS runner

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy DuckDB bindings/extensions
COPY --from=builder /app/node_modules/@duckdb ./node_modules/@duckdb
COPY --from=builder /app/.duckdb /app/.duckdb

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

ENV HOME=/app

EXPOSE 3000
CMD ["node", "server.js"]
