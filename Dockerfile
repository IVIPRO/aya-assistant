FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/aya-assistant build || true
RUN pnpm --filter @workspace/api-server build || true
EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.cjs"]
