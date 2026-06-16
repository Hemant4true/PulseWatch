-- DropIndex
DROP INDEX "ActivityLog_workspaceId_idx";

-- DropIndex
DROP INDEX "Alert_monitorId_idx";

-- DropIndex
DROP INDEX "Alert_workspaceId_idx";

-- DropIndex
DROP INDEX "Incident_monitorId_idx";

-- DropIndex
DROP INDEX "Incident_status_idx";

-- DropIndex
DROP INDEX "MonitorCheck_monitorId_checkedAt_idx";

-- DropIndex
DROP INDEX "MonitorCheck_status_idx";

-- CreateIndex
CREATE INDEX "ActivityLog_workspaceId_createdAt_idx" ON "ActivityLog"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Alert_workspaceId_sentAt_idx" ON "Alert"("workspaceId", "sentAt" DESC);

-- CreateIndex
CREATE INDEX "Incident_monitorId_status_idx" ON "Incident"("monitorId", "status");

-- CreateIndex
CREATE INDEX "MonitorCheck_monitorId_checkedAt_status_idx" ON "MonitorCheck"("monitorId", "checkedAt" DESC, "status");
