-- CreateTable
CREATE TABLE "ServerMetrics" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "cpuUsagePercent" DOUBLE PRECISION NOT NULL,
    "cpuLoadAverage" DOUBLE PRECISION,
    "cpuCoreCount" INTEGER,
    "ramUsedMB" INTEGER NOT NULL,
    "ramTotalMB" INTEGER NOT NULL,
    "ramUsagePercent" DOUBLE PRECISION NOT NULL,
    "diskUsedGB" DOUBLE PRECISION NOT NULL,
    "diskTotalGB" DOUBLE PRECISION NOT NULL,
    "diskUsagePercent" DOUBLE PRECISION NOT NULL,
    "cpuThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "ramThreshold" DOUBLE PRECISION NOT NULL DEFAULT 85.0,
    "diskThreshold" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "hostname" TEXT,
    "osType" TEXT,
    "osVersion" TEXT,
    "healthy" BOOLEAN NOT NULL DEFAULT true,
    "issues" JSONB,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerHealth" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "containerName" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "imageTag" TEXT,
    "status" TEXT NOT NULL,
    "state" TEXT,
    "exitCode" INTEGER,
    "healthStatus" TEXT,
    "healthChecks" JSONB,
    "cpuUsagePercent" DOUBLE PRECISION,
    "memoryUsedMB" INTEGER,
    "memoryLimitMB" INTEGER,
    "networkRxMB" DOUBLE PRECISION,
    "networkTxMB" DOUBLE PRECISION,
    "uptime" INTEGER,
    "restartCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "alertOnUnhealthy" BOOLEAN NOT NULL DEFAULT true,
    "alertOnRestart" BOOLEAN NOT NULL DEFAULT true,
    "healthy" BOOLEAN NOT NULL DEFAULT true,
    "issues" JSONB,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContainerHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusterMetrics" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "clusterName" TEXT NOT NULL,
    "namespace" TEXT,
    "nodeCount" INTEGER NOT NULL,
    "nodesReady" INTEGER NOT NULL,
    "nodesNotReady" INTEGER NOT NULL DEFAULT 0,
    "podCount" INTEGER NOT NULL,
    "podsRunning" INTEGER NOT NULL,
    "podsPending" INTEGER NOT NULL DEFAULT 0,
    "podsFailed" INTEGER NOT NULL DEFAULT 0,
    "cpuRequestPercent" DOUBLE PRECISION,
    "cpuLimitPercent" DOUBLE PRECISION,
    "memRequestPercent" DOUBLE PRECISION,
    "memLimitPercent" DOUBLE PRECISION,
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "componentStatus" JSONB,
    "deploymentCount" INTEGER,
    "serviceCount" INTEGER,
    "ingressCount" INTEGER,
    "pvcCount" INTEGER,
    "warningEvents" JSONB,
    "errorEvents" JSONB,
    "nodeReadyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "podRunningThreshold" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "healthy" BOOLEAN NOT NULL DEFAULT true,
    "issues" JSONB,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClusterMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryPerformance" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "databaseType" TEXT NOT NULL,
    "databaseName" TEXT,
    "databaseHost" TEXT,
    "queryHash" TEXT NOT NULL,
    "queryText" TEXT,
    "queryType" TEXT,
    "executionTimeMs" DOUBLE PRECISION NOT NULL,
    "rowsAffected" INTEGER,
    "rowsExamined" INTEGER,
    "isSlowQuery" BOOLEAN NOT NULL DEFAULT false,
    "slowQueryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "useIndex" BOOLEAN,
    "explainPlan" JSONB,
    "endpoint" TEXT,
    "userId" TEXT,
    "queryCount" INTEGER NOT NULL DEFAULT 1,
    "performanceScore" INTEGER,
    "optimizationTips" JSONB,
    "avgExecutionMs" DOUBLE PRECISION,
    "maxExecutionMs" DOUBLE PRECISION,
    "minExecutionMs" DOUBLE PRECISION,
    "p95ExecutionMs" DOUBLE PRECISION,
    "p99ExecutionMs" DOUBLE PRECISION,
    "healthy" BOOLEAN NOT NULL DEFAULT true,
    "issues" JSONB,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerMetrics_siteId_idx" ON "ServerMetrics"("siteId");

-- CreateIndex
CREATE INDEX "ServerMetrics_checkedAt_idx" ON "ServerMetrics"("checkedAt");

-- CreateIndex
CREATE INDEX "ServerMetrics_healthy_idx" ON "ServerMetrics"("healthy");

-- CreateIndex
CREATE INDEX "ServerMetrics_cpuUsagePercent_idx" ON "ServerMetrics"("cpuUsagePercent");

-- CreateIndex
CREATE INDEX "ServerMetrics_ramUsagePercent_idx" ON "ServerMetrics"("ramUsagePercent");

-- CreateIndex
CREATE INDEX "ServerMetrics_diskUsagePercent_idx" ON "ServerMetrics"("diskUsagePercent");

-- CreateIndex
CREATE INDEX "ContainerHealth_siteId_idx" ON "ContainerHealth"("siteId");

-- CreateIndex
CREATE INDEX "ContainerHealth_containerId_idx" ON "ContainerHealth"("containerId");

-- CreateIndex
CREATE INDEX "ContainerHealth_containerName_idx" ON "ContainerHealth"("containerName");

-- CreateIndex
CREATE INDEX "ContainerHealth_status_idx" ON "ContainerHealth"("status");

-- CreateIndex
CREATE INDEX "ContainerHealth_healthStatus_idx" ON "ContainerHealth"("healthStatus");

-- CreateIndex
CREATE INDEX "ContainerHealth_checkedAt_idx" ON "ContainerHealth"("checkedAt");

-- CreateIndex
CREATE INDEX "ContainerHealth_healthy_idx" ON "ContainerHealth"("healthy");

-- CreateIndex
CREATE INDEX "ClusterMetrics_siteId_idx" ON "ClusterMetrics"("siteId");

-- CreateIndex
CREATE INDEX "ClusterMetrics_clusterName_idx" ON "ClusterMetrics"("clusterName");

-- CreateIndex
CREATE INDEX "ClusterMetrics_namespace_idx" ON "ClusterMetrics"("namespace");

-- CreateIndex
CREATE INDEX "ClusterMetrics_healthStatus_idx" ON "ClusterMetrics"("healthStatus");

-- CreateIndex
CREATE INDEX "ClusterMetrics_checkedAt_idx" ON "ClusterMetrics"("checkedAt");

-- CreateIndex
CREATE INDEX "ClusterMetrics_healthy_idx" ON "ClusterMetrics"("healthy");

-- CreateIndex
CREATE INDEX "QueryPerformance_siteId_idx" ON "QueryPerformance"("siteId");

-- CreateIndex
CREATE INDEX "QueryPerformance_databaseType_idx" ON "QueryPerformance"("databaseType");

-- CreateIndex
CREATE INDEX "QueryPerformance_queryHash_idx" ON "QueryPerformance"("queryHash");

-- CreateIndex
CREATE INDEX "QueryPerformance_isSlowQuery_idx" ON "QueryPerformance"("isSlowQuery");

-- CreateIndex
CREATE INDEX "QueryPerformance_executionTimeMs_idx" ON "QueryPerformance"("executionTimeMs");

-- CreateIndex
CREATE INDEX "QueryPerformance_checkedAt_idx" ON "QueryPerformance"("checkedAt");

-- CreateIndex
CREATE INDEX "QueryPerformance_healthy_idx" ON "QueryPerformance"("healthy");

-- AddForeignKey
ALTER TABLE "ServerMetrics" ADD CONSTRAINT "ServerMetrics_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerHealth" ADD CONSTRAINT "ContainerHealth_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusterMetrics" ADD CONSTRAINT "ClusterMetrics_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryPerformance" ADD CONSTRAINT "QueryPerformance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
