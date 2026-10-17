import "client-only";
import Dexie, { type EntityTable, type Table } from "dexie";
import type {
  Driver,
  MetaEntry,
  Order,
  OutboxEntry,
  Settlement,
  SyncTable,
} from "./types";

export type LocalDB = Dexie & {
  drivers: EntityTable<Driver, "id">;
  orders: EntityTable<Order, "id">;
  settlements: EntityTable<Settlement, "id">;
  outbox: Table<OutboxEntry, [SyncTable, string]>;
  meta: EntityTable<MetaEntry, "key">;
};

function createDb(): LocalDB {
  const db = new Dexie("delivery-office") as LocalDB;

  // الحقول المذكورة هنا فقط هي المفهرسة. الحقول المنطقية (boolean) لا تُفهرس
  // في IndexedDB، فنفلتر عليها في الكود.
  db.version(1).stores({
    drivers: "id, name, updatedAt",
    orders: "id, date, driverId, settlementId, [driverId+date], updatedAt",
    settlements: "id, driverId, date, updatedAt",
    outbox: "[table+recordId], createdAt",
    meta: "key",
  });

  return db;
}

export const db = createDb();

/** معرّف هذا الجهاز (يُنشأ مرة واحدة ويبقى) */
export function getDeviceId(): Promise<string> {
  return db.transaction("rw", db.meta, async () => {
    const existing = await db.meta.get("deviceId");
    if (existing) return existing.value;

    const value = crypto.randomUUID();
    await db.meta.put({ key: "deviceId", value });
    return value;
  });
}
