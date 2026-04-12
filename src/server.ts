import dotenv from "dotenv";
dotenv.config({ quiet: true });

import http from "http";
import app from "@/app.js";
import { connectDB } from "@/shared/database/mongo.js";


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
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  console.log(`Server running on ${bind}`);
}
