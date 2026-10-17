import { isValidISODate, type ISODate } from "@/lib/dates";
import {
  calcCommission,
  DEFAULT_COMMISSION_RATE_BP,
  type Agorot,
} from "@/lib/money";
import { nowISO } from "@/lib/time";
import { db } from "./db";
import { DomainError } from "./errors";
import { enqueue } from "./outbox";
import type { Driver, Order } from "./types";

export interface OrderInput {
  date: ISODate;
  driverId: string;
  amount: Agorot;
  details?: string | null;
  notes?: string | null;
  fareReceived?: boolean;
  /** عمولة يدوية. إن غابت تُحسب تلقائيًا بالنسبة المحفوظة. */
  commissionAmount?: Agorot;
  /** عمولة مغلقة منذ البداية (استيراد أو إغلاق يدوي بدون تسوية). */
  commissionClosed?: boolean;
}

export type OrderPatch = Partial<OrderInput>;

function trimOrNull(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function assertDate(date: string) {
  if (!isValidISODate(date)) {
    throw new DomainError("INVALID_INPUT", "التاريخ غير صالح");
  }
}

function assertAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new DomainError("INVALID_INPUT", "المبلغ غير صالح");
  }
}

function assertCommission(commission: number) {
  if (!Number.isSafeInteger(commission) || commission < 0) {
    throw new DomainError("INVALID_INPUT", "العمولة غير صالحة");
  }
}

async function requireActiveDriver(driverId: string): Promise<Driver> {
  const driver = await db.drivers.get(driverId);
  if (!driver || driver.deletedAt) {
    throw new DomainError("NOT_FOUND", "السائق غير موجود");
  }
  if (!driver.isActive) {
    throw new DomainError("DRIVER_INACTIVE", "هذا السائق معطّل");
  }
  return driver;
}

async function requireOrder(id: string): Promise<Order> {
  const order = await db.orders.get(id);
  if (!order || order.deletedAt) {
    throw new DomainError("NOT_FOUND", "الطلبية غير موجودة");
  }
  return order;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  assertDate(input.date);
  assertAmount(input.amount);
  if (input.commissionAmount !== undefined) {
    assertCommission(input.commissionAmount);
  }

  return db.transaction("rw", db.drivers, db.orders, db.outbox, async () => {
    await requireActiveDriver(input.driverId);

    const rateBp = DEFAULT_COMMISSION_RATE_BP;
    const automatic = calcCommission(input.amount, rateBp);
    const commissionAmount = input.commissionAmount ?? automatic;

    const order: Order = {
      id: crypto.randomUUID(),
      date: input.date,
      driverId: input.driverId,
      details: trimOrNull(input.details),
      notes: trimOrNull(input.notes),
      amount: input.amount,
      fareReceived: input.fareReceived ?? true,
      commissionRateBp: rateBp,
      commissionAmount,
      // تعديل يدوي فقط إذا اختلفت عن الحساب التلقائي
      commissionOverridden: commissionAmount !== automatic,
      commissionClosed: input.commissionClosed ?? false,
      settlementId: null,
      version: 0,
      updatedAt: nowISO(),
      deletedAt: null,
    };

    await db.orders.add(order);
    await enqueue("orders", order.id, 0);
    return order;
  });
}

export async function updateOrder(
  id: string,
  patch: OrderPatch,
): Promise<Order> {
  return db.transaction("rw", db.drivers, db.orders, db.outbox, async () => {
    const existing = await requireOrder(id);
    const next: Order = { ...existing };

    if (patch.date !== undefined) {
      assertDate(patch.date);
      next.date = patch.date;
    }
    if (patch.driverId !== undefined && patch.driverId !== existing.driverId) {
      await requireActiveDriver(patch.driverId);
      next.driverId = patch.driverId;
    }
    if (patch.amount !== undefined) {
      assertAmount(patch.amount);
      next.amount = patch.amount;
    }
    if (patch.details !== undefined) next.details = trimOrNull(patch.details);
    if (patch.notes !== undefined) next.notes = trimOrNull(patch.notes);
    if (patch.fareReceived !== undefined)
      next.fareReceived = patch.fareReceived;

    if (patch.commissionAmount !== undefined) {
      assertCommission(patch.commissionAmount);
      next.commissionAmount = patch.commissionAmount;
      next.commissionOverridden =
        patch.commissionAmount !==
        calcCommission(next.amount, next.commissionRateBp);
    } else if (
      next.amount !== existing.amount &&
      !existing.commissionOverridden
    ) {
      next.commissionAmount = calcCommission(
        next.amount,
        next.commissionRateBp,
      );
    }

    const financialChanged =
      next.date !== existing.date ||
      next.driverId !== existing.driverId ||
      next.amount !== existing.amount ||
      next.commissionAmount !== existing.commissionAmount;

    if (existing.commissionClosed && financialChanged) {
      throw new DomainError(
        "ORDER_LOCKED",
        "الطلبية مغلقة داخل تسوية. ألغِ التسوية أولًا لتعديل التاريخ أو السائق أو المبالغ",
      );
    }

    next.updatedAt = nowISO();
    await db.orders.put(next);
    await enqueue("orders", id, existing.version);
    return next;
  });
}

/** حذف ناعم: السجل يبقى ويُعلَّم محذوفًا لينتقل الحذف بالمزامنة. */
export async function deleteOrder(id: string): Promise<void> {
  return db.transaction("rw", db.orders, db.outbox, async () => {
    const existing = await requireOrder(id);

    if (existing.commissionClosed) {
      throw new DomainError(
        "ORDER_LOCKED",
        "الطلبية مغلقة داخل تسوية. أخرجها من التسوية أولًا",
      );
    }

    const now = nowISO();
    await db.orders.put({ ...existing, deletedAt: now, updatedAt: now });
    await enqueue("orders", id, existing.version);
  });
}
