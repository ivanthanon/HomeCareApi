FROM node:22-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm@latest
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3006
CMD ["node", "--require", "./dist/startup/telemetryStartup.js", "dist/main"]
