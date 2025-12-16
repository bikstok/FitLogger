import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import cors from "cors";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

import session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      // In production (HTTPS) set secure=true. During local/docker development you
      // likely will not use TLS so set secure based on NODE_ENV.
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.SESSION_SAME_SITE || 'lax',
    },
  })
);

import helmet from "helmet";
app.use(helmet());

// Routers
import registerRouter from "./routers/registerRouter.js";
app.use(registerRouter);

import loginRouter from "./routers/loginRouter.js";
app.use(loginRouter);

import logoutRouter from "./routers/logoutRouter.js";
app.use(logoutRouter);

import sessionRouter from "./routers/sessionRouter.js";
app.use(sessionRouter);


const clientDist = path.join(__dirname, 'public');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});
}

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
});
