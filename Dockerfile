FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/ ./lib/
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN cd artifacts/api-server && npx tsx ./build.ts
EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.cjs"]
