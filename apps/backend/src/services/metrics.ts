import { Request, Response, NextFunction } from "express";
import client from "prom-client";

// Initialize Prometheus Registry
export const register = new client.Registry();

// Add default recommended labels (app, environment)
register.setDefaultLabels({
  app: "trenno-backend",
  env: process.env.NODE_ENV,
});

// Enable default runtime metrics (process CPU, memory, event loop lag, GC, heap)
client.collectDefaultMetrics({ register });

// -------------------------------------------------------------
// Custom Application Metrics
// -------------------------------------------------------------

// HTTP Request Duration Histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// HTTP Requests Total Counter
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests processed",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Active WebSocket Connections Gauge
export const activeWebSocketConnections = new client.Gauge({
  name: "active_websocket_connections",
  help: "Number of currently active real-time WebSocket client connections",
  registers: [register],
});

// -------------------------------------------------------------
// Express Metrics Middleware
// -------------------------------------------------------------
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Exclude /metrics itself to avoid circular self-monitoring noise
  if (req.path === "/metrics") {
    return next();
  }

  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    // Label by the matched route pattern (e.g. /api/v1/projects/:key), never the raw path.
    // Requests no route handled (404s, scanners) share one label, so random URLs
    // cannot create new time series.
    let route = req.route ? req.baseUrl + req.route.path : "unmatched";
    // Replace UUIDs with :id in route metric
    route = route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id");

    const statusCode = res.statusCode.toString();

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationInSeconds
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });
  });

  next();
}
