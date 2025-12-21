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

app.use(
  cors({
    origin: "http://localhost:5173",
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
      secure: false,
      httpOnly: true,
      sameSite: "lax",
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

import exercisesRouter from "./routers/exercisesRouter.js";
app.use(exercisesRouter);

import workoutsRouter from "./routers/workoutsRouter.js";
app.use(workoutsRouter);

import routinesRouter from "./routers/routinesRouter.js";
app.use(routinesRouter);

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
