import dotenv from "dotenv";
dotenv.config({ quiet: true });

import http from "http";
import app from "@/app.js";
import prisma from "@/shared/config/prisma.js";
import { notificationService } from "./modules/notification/notification.service.js";

const PORT = normalizePort(process.env.PORT || "5000");
app.set("port", PORT);

const server = http.createServer(app);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    notificationService.checkTaskDeadlines().catch((err) => {
      console.error("Failed to check task deadlines on boot:", err);
    });

    setInterval(() => {
      notificationService.checkTaskDeadlines().catch((err) => {
        console.error("Failed to check task deadlines in interval:", err);
      });
    }, 24 * 60 * 60 * 1000);

    server.listen(PORT);
    server.on("error", onError);
    server.on("listening", onListening);
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
  process.exit(0);
});

function normalizePort(val: string): number | string | false {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") throw error;
  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  console.log(`Server running on ${bind}`);
}