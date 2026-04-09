FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN cd artifacts/api-server && npx tsc
EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.js"]
