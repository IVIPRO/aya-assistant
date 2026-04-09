FROM node:22-alpine
RUN npm install -g pnpm tsx
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
EXPOSE 8080
CMD ["tsx", "artifacts/api-server/src/index.ts"]
