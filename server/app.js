import "dotenv/config";
import express from "express";
import path from "path";
import http from "http";
import session from "express-session";
import supabase from "./util/supabaseUtil.js";
import { emitUserDisconnected, emitUserCount } from "./util/socketUtil.js";
import generalLimiter from "./util/generalLimiterUtil.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();
app.use(express.json());

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
  },
});

app.use(sessionMiddleware);

app.use(generalLimiter);

const server = http.createServer(app);
// Sockets
import { Server } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});

io.engine.use(sessionMiddleware);

io.on("connection", async (socket) => {
  const userId = socket.request.session?.userId;
  if (userId) {
    const { data } = await supabase
      .from("users")
      .select("user_name")
      .eq("id", userId)
      .single();
    if (data) socket.data.username = data.user_name;
  }

  socket.on("disconnect", () => {
    if (socket.data.username) {
      emitUserDisconnected(io, socket.data.username);
    }
    emitUserCount(io, io.engine.clientsCount);
  });

  emitUserCount(io, io.engine.clientsCount);
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// CORS
import cors from "cors";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
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

import statisticsRouter from "./routers/statisticsRouter.js";
app.use(statisticsRouter);

import routinesRouter from "./routers/routinesRouter.js";
app.use(routinesRouter);

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
});
