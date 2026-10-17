import { nowISO } from "@/lib/time";
import { db } from "./db";
import { DomainError } from "./errors";
import { enqueue } from "./outbox";
import type { Driver } from "./types";

export interface DriverInput {
  name: string;
  address: string;
  phones?: string[];
  walletNumber?: string | null;
  walletType?: string | null;
}

export type DriverPatch = Partial<DriverInput> & { isActive?: boolean };

function cleanText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function trimOrNull(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function normalizePhones(phones: string[] = []): string[] {
  return [...new Set(phones.map((phone) => phone.trim()).filter(Boolean))];
}

function nameKey(name: string): string {
  return cleanText(name).toLocaleLowerCase();
}

/** نفحص كل السائقين (حتى المعطّلين) لأن قيد الفرادة في السيرفر يشملهم. */
async function assertNameAvailable(name: string, exceptId?: string) {
  const wanted = nameKey(name);
  const clash = await db.drivers
    .filter(
      (driver) => driver.id !== exceptId && nameKey(driver.name) === wanted,
    )
    .first();

  if (clash) {
    throw new DomainError(
      "DUPLICATE_DRIVER_NAME",
      "يوجد سائق بهذا الاسم مسبقًا",
    );
  }
}

export async function createDriver(input: DriverInput): Promise<Driver> {
  const name = cleanText(input.name);
  const address = cleanText(input.address);

  if (!name) throw new DomainError("INVALID_INPUT", "اسم السائق مطلوب");
  if (!address) throw new DomainError("INVALID_INPUT", "العنوان مطلوب");

  return db.transaction("rw", db.drivers, db.outbox, async () => {
    await assertNameAvailable(name);

    const driver: Driver = {
      id: crypto.randomUUID(),
      name,
      address,
      phones: normalizePhones(input.phones),
      walletNumber: trimOrNull(input.walletNumber),
      walletType: trimOrNull(input.walletType),
      isActive: true,
      version: 0,
      updatedAt: nowISO(),
      deletedAt: null,
    };

    await db.drivers.add(driver);
    await enqueue("drivers", driver.id, 0);
    return driver;
  });
}

export async function updateDriver(id: string, patch: DriverPatch): Promise<Driver> {
  return db.transaction("rw", db.drivers, db.outbox, async () => {
    const existing = await db.drivers.get(id);
    if (!existing || existing.deletedAt) {
      throw new DomainError("NOT_FOUND", "السائق غير موجود");
    }

    const next: Driver = { ...existing };

    if (patch.name !== undefined) {
      const name = cleanText(patch.name);
      if (!name) throw new DomainError("INVALID_INPUT", "اسم السائق مطلوب");
      await assertNameAvailable(name, id);
      next.name = name;
    }
    if (patch.address !== undefined) {
      const address = cleanText(patch.address);
      if (!address) throw new DomainError("INVALID_INPUT", "العنوان مطلوب");
      next.address = address;
    }
    if (patch.phones !== undefined) next.phones = normalizePhones(patch.phones);
    if (patch.walletNumber !== undefined) {
      next.walletNumber = trimOrNull(patch.walletNumber);
    }
    if (patch.walletType !== undefined) {
      next.walletType = trimOrNull(patch.walletType);
    }
    if (patch.isActive !== undefined) next.isActive = patch.isActive;

    next.updatedAt = nowISO();
    await db.drivers.put(next);
    await enqueue("drivers", id, existing.version);
    return next;
  });
}

/** السائقون لا يُحذفون، بل يُعطَّلون (تبقى طلبياتهم وتقاريرهم). */
export async function setDriverActive(
  id: string,
  isActive: boolean,
): Promise<Driver> {
  return updateDriver(id, { isActive });
}
