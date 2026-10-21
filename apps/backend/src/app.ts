import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function createApp(): express.Express {
  const app = express();

  // Trust exactly one proxy hop: our nginx, which appends the real client
  // address to X-Forwarded-For. req.ip then ignores anything a client puts
  // in that header itself. The backend is not reachable except through nginx.
  app.set("trust proxy", 1);

  // Basic middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS configuration: the only origin is the HTTPS front door (nginx on 8443)
  const allowedOrigin = process.env.APP_URL || "https://localhost:8443";
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  );

  // Basic API info
  app.get("/api/v1", (_req: Request, res: Response) => {
    res.json({
      name: "Trenno API",
      version: "0.1.0",
      status: "operational",
    });
  });

  // Health check endpoint conforming to NFR-30
  app.get("/api/v1/health", async (_req: Request, res: Response) => {
    let databaseStatus = "disconnected";
    let isHealthy = true;

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = "connected";
    } catch (err) {
      console.error("[Health] Database check failed:", err);
      databaseStatus = "disconnected";
      isHealthy = false;
    }

    const payload = {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
      },
    };

    res.status(isHealthy ? 200 : 503).json(payload);
  });

  // Generic 404 handler for API routes
  app.use("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "API endpoint not found",
      },
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Backend Error]", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
      },
    });
  });

  return app;
}
