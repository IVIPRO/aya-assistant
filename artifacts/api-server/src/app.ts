import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const PgSession = ConnectPgSimple(session);

const _sessionSecret = process.env.SESSION_SECRET;
if (!_sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SESSION_SECRET: string = _sessionSecret;

const app: Express = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use("/api", router);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, "..", "..", "aya-assistant", "dist", "public");
app.use(express.static(publicDir));

app.get(/^(?!\/api).*$/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
