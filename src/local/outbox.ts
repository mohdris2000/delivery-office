import { nowISO } from "@/lib/time";
import { db } from "./db";
import type { SyncTable } from "./types";

/**
 * يسجّل أن هذا السجل تغيّر ويحتاج إرسالًا للسيرفر.
 * يجب استدعاؤه داخل معاملة تشمل db.outbox.
 * إن كان السجل مسجّلًا أصلًا نبقي baseVersion القديم (النسخة قبل أول تعديل).
 */
export async function enqueue(
  table: SyncTable,
  recordId: string,
  versionBeforeChange: number,
): Promise<void> {
  const existing = await db.outbox.get([table, recordId]);
  if (existing) return;

  await db.outbox.put({
    table,
    recordId,
    baseVersion: versionBeforeChange,
    createdAt: nowISO(),
  });
}
