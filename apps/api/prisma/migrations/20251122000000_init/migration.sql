-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('OFFLINE', 'STREAMING', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rtspUrl" TEXT NOT NULL,
    "username" TEXT,
    "passwordEnc" TEXT,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scoreThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    "site" TEXT,
    "tags" TEXT,
    "mtxPath" TEXT NOT NULL,
    "status" "CameraStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "labels" TEXT[],
    "snapshotRef" TEXT,
    "message" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "falsePositive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_mtxPath_key" ON "Camera"("mtxPath");

-- CreateIndex
CREATE INDEX "Alert_cameraId_idx" ON "Alert"("cameraId");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;