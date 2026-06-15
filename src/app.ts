import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import corsOptions from "@/shared/config/cores.options";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import timeout from "connect-timeout";
import globalErrorHandler from "@/shared/middleware/globalErrorHandler.middleware";
import i18n from "i18n";
import { i18nMiddleware } from "@/shared/config/i18n";
import { notFoundMiddleware } from "@/shared/middleware/not_found.middleware";
import dotenv from "dotenv";
import { GlobalRouter } from "./modules/dashboard";

dotenv.config({ quiet: true });

if (!process.env.NODE_ENV) {
  console.warn("Warning: NODE_ENV is not set, defaulting to 'production'");
  process.env.NODE_ENV = "production";
}

const app: Application = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);



app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.removeHeader("X-Powered-By");
  next();
});

app.use(cors(corsOptions));

app.use(timeout("50s"));
app.use(express.json({
  limit: "10kb",
  verify: (req: any, _res, buf) => {
    if (req.originalUrl.includes("/webhook")) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(i18n.init);
app.use(i18nMiddleware);

app.use(
  hpp({
    whitelist: ["filter", "sort"], // parameters allowed to be duplicated
  }),
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(compression());

app.get("/test-hash", async (req, res) => {
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.default.hash("Password123", 10);
  const isValid = await bcrypt.default.compare("Password123", hash);
  res.json({ hash, isValid });
});

app.use("/api/v1", GlobalRouter);

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (!req.timedout) next();
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 Not Found Middleware
app.use(notFoundMiddleware);

// Global Error Handler
app.use(globalErrorHandler);

export default app;