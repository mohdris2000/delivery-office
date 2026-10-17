-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "driver_id" UUID NOT NULL,
    "details" TEXT,
    "notes" TEXT,
    "amount" INTEGER NOT NULL,
    "fare_received" BOOLEAN NOT NULL DEFAULT true,
    "commission_rate_bp" INTEGER NOT NULL,
    "commission_amount" INTEGER NOT NULL,
    "commission_overridden" BOOLEAN NOT NULL DEFAULT false,
    "commission_closed" BOOLEAN NOT NULL DEFAULT false,
    "settlement_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by_device" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "closed_total" INTEGER NOT NULL,
    "offset_amount" INTEGER NOT NULL DEFAULT 0,
    "paid_amount" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by_device" TEXT,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_driver_id_date_idx" ON "orders"("driver_id", "date");

-- CreateIndex
CREATE INDEX "orders_date_idx" ON "orders"("date");

-- CreateIndex
CREATE INDEX "orders_settlement_id_idx" ON "orders"("settlement_id");

-- CreateIndex
CREATE INDEX "orders_updated_at_idx" ON "orders"("updated_at");

-- CreateIndex
CREATE INDEX "settlements_driver_id_date_idx" ON "settlements"("driver_id", "date");

-- CreateIndex
CREATE INDEX "settlements_updated_at_idx" ON "settlements"("updated_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
