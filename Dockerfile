FROM node:22-slim
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/aya-assistant build
RUN pnpm --filter @workspace/api-server build
EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.mjs"]
