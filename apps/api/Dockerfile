FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ── Stage 1: Install all dependencies ──────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ── Stage 2: Build the API ─────────────────────────────────────
FROM base AS build
COPY --from=deps /app .
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY apps/api/src ./apps/api/src
COPY packages/ ./packages/
RUN npx prisma generate
RUN pnpm --filter @crm/shared build && pnpm --filter @crm/events build
RUN pnpm --filter @crm/api build

# ── Stage 3: Production runtime ────────────────────────────────
FROM base AS runtime
RUN addgroup --system --gid 1001 api && adduser --system --uid 1001 api

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

COPY apps/api/scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER api
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/index.js"]
