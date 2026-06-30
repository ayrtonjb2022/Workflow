FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm --filter @crm/api build
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
