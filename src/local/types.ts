import type { ISODate } from "@/lib/dates";
import type { Agorot } from "@/lib/money";

/** حقول المزامنة المشتركة بين كل السجلات */
export interface SyncFields {
  /** آخر نسخة معروفة من السيرفر (0 = لم يُزامَن بعد) */
  version: number;
  /** وقت آخر تعديل محلي (ISO datetime) */
  updatedAt: string;
  /** وقت الحذف (soft delete)، أو null */
  deletedAt: string | null;
}

export interface Driver extends SyncFields {
  id: string;
  name: string;
  address: string;
  phones: string[];
  walletNumber: string | null;
  walletType: string | null;
  isActive: boolean;
}

export interface Order extends SyncFields {
  id: string;
  date: ISODate;
  driverId: string;
  details: string | null;
  notes: string | null;
  amount: Agorot;
  fareReceived: boolean;
  commissionRateBp: number;
  commissionAmount: Agorot;
  commissionOverridden: boolean;
  commissionClosed: boolean;
  settlementId: string | null;
}

export type SettlementStatus = "ACTIVE" | "CANCELLED";

export interface Settlement extends SyncFields {
  id: string;
  driverId: string;
  date: ISODate;
  closedTotal: Agorot;
  offsetAmount: Agorot;
  paidAmount: Agorot;
  notes: string | null;
  status: SettlementStatus;
}

/** الجداول التي تُزامَن مع السيرفر */
export type SyncTable = "drivers" | "orders" | "settlements";

/**
 * طابور التغييرات التي لم تُرسل بعد.
 * سجل واحد لكل (جدول + معرّف): تعديلات متعددة على نفس السجل تُدمج،
 * ويُرسل آخر شكل له عند المزامنة.
 */
export interface OutboxEntry {
  table: SyncTable;
  recordId: string;
  /** نسخة السجل عند أول تعديل بعد آخر مزامنة (يستخدمها السيرفر لكشف التعارض) */
  baseVersion: number;
  createdAt: string;
}

/** إعدادات صغيرة: deviceId، آخر مؤشر مزامنة... */
export interface MetaEntry {
  key: string;
  value: string;
}
