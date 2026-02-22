import "dotenv/config";
import http from "http";
import app from "@/app.js";
import { connectDB, disconnectDB } from "@/shared/database/prisma.js";

const PORT = normalizePort(process.env.PORT || "5000");
app.set("port", PORT);

const server = http.createServer(app);

(async () => {
  try {
    await connectDB();
    server.listen(PORT);
  } catch (err) {
    console.error("Failed to connect to DB");
    console.error(err);
    process.exit(1);
  }
})();

server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val: string): number | string | false {
  const port = parseInt(val, 10);

  if (isNaN(port)) return val; // named pipe
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
  const bind = typeof addr === "string" ? `pipe ${addr}` : `${addr?.port}`;
  console.log(`Server running on http://localhost:${bind}`);
}
// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    await disconnectDB();
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    await disconnectDB();
    console.log("HTTP server closed");
    process.exit(0);
  });
});
