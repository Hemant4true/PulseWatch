import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { generalLimiter } from "./middleware/rateLimit.middleware";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import monitorsRoutes from "./routes/monitors.routes";
import alertsRoutes from "./routes/alerts.routes";
import incidentsRoutes from "./routes/incidents.routes";
import statusPageRoutes from "./routes/statusPage.routes";
import publicRoutes from "./routes/public.routes";
import analyticsRoutes from "./routes/analytics.routes";
import teamRoutes from "./routes/team.routes";
import adminRoutes from "./routes/admin.routes";
import dashboardSseRoutes from "./routes/dashboardSse.routes";
import { startCronJobs, engineState } from "./jobs/cron.job";
import { prisma } from "./lib/prisma";

const app = express();
const port = process.env.PORT || 4000;

// Setup Morgan logging but skip /api/health to avoid noise
app.use(morgan("combined", {
  skip: (req) => req.url === '/api/health'
}));

app.use(helmet());

// Apply general rate limit to all requests
app.use(generalLimiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sse/dashboard", dashboardSseRoutes);
app.use("/api/monitors", monitorsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/incidents", incidentsRoutes);
app.use("/api/status-pages", statusPageRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", async (req, res) => {
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (e) {}

  res.json({ 
    status: "ok",
    cronRunning: engineState.cronRunning,
    lastCheckAt: engineState.lastCheckAt,
    dbConnected
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  startCronJobs();
});

if (process.env.RUN_SEED === 'true') {
  import('./../../prisma/seed.js').then(({ main }) => {
    main()
      .then(() => console.log('[SEED] Database seeded successfully'))
      .catch((e) => console.error('[SEED] Seed failed:', e))
  })
}
