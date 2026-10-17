import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createDriver, setDriverActive, updateDriver } from "./drivers";
import { createOrder, deleteOrder, updateOrder } from "./orders";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

const newDriver = (name = "أحمد ريشة") =>
  createDriver({ name, address: "عنوان تجريبي" });

describe("السائقون", () => {
  it("ينشئ سائقًا ويضعه في طابور المزامنة", async () => {
    const driver = await newDriver();

    expect(await db.drivers.get(driver.id)).toMatchObject({
      name: "أحمد ريشة",
      isActive: true,
      version: 0,
    });
    const entry = await db.outbox.get(["drivers", driver.id]);
    expect(entry?.baseVersion).toBe(0);
  });

  it("يرفض اسمًا مكررًا حتى لو اختلفت المسافات", async () => {
    await newDriver("أحمد ريشة");
    await expect(newDriver("  أحمد   ريشة ")).rejects.toMatchObject({
      code: "DUPLICATE_DRIVER_NAME",
    });
  });

  it("يرفض الاسم الفارغ", async () => {
    await expect(newDriver("   ")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("يدمج التعديلات المتعددة في سجل outbox واحد ويحفظ النسخة الأساسية", async () => {
    const driver = await newDriver();
    await db.outbox.clear();
    await db.drivers.update(driver.id, { version: 3 });

    await updateDriver(driver.id, { address: "عنوان أ" });
    await updateDriver(driver.id, { address: "عنوان ب" });

    expect(await db.outbox.count()).toBe(1);
    const entry = await db.outbox.get(["drivers", driver.id]);
    expect(entry?.baseVersion).toBe(3);
  });
});

describe("الطلبيات", () => {
  it("ينشئ طلبية بعمولة 20% تلقائيًا", async () => {
    const driver = await newDriver();
    const order = await createOrder({
      date: "2026-10-17",
      driverId: driver.id,
      amount: 1500,
    });

    expect(order).toMatchObject({
      commissionAmount: 300,
      commissionOverridden: false,
      commissionClosed: false,
      fareReceived: true,
    });
    expect(await db.outbox.get(["orders", order.id])).toBeDefined();
  });

  it("يرفض المدخلات غير الصالحة", async () => {
    const driver = await newDriver();
    const base = { date: "2026-10-17", driverId: driver.id, amount: 1500 };

    await expect(createOrder({ ...base, amount: 0 })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await expect(createOrder({ ...base, amount: 12.5 })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await expect(
      createOrder({ ...base, date: "2026-02-30" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("يرفض طلبية لسائق معطّل", async () => {
    const driver = await newDriver();
    await setDriverActive(driver.id, false);

    await expect(
      createOrder({ date: "2026-10-17", driverId: driver.id, amount: 1500 }),
    ).rejects.toMatchObject({ code: "DRIVER_INACTIVE" });
  });

  it("يعيد حساب العمولة عند تعديل المبلغ", async () => {
    const driver = await newDriver();
    const order = await createOrder({
      date: "2026-10-17",
      driverId: driver.id,
      amount: 1500,
    });

    const updated = await updateOrder(order.id, { amount: 2000 });
    expect(updated.commissionAmount).toBe(400);
  });

  it("يحترم العمولة اليدوية عند تعديل المبلغ", async () => {
    const driver = await newDriver();
    const order = await createOrder({
      date: "2026-10-17",
      driverId: driver.id,
      amount: 1500,
      commissionAmount: 250,
    });
    expect(order.commissionOverridden).toBe(true);

    const updated = await updateOrder(order.id, { amount: 2000 });
    expect(updated.commissionAmount).toBe(250);
    expect(updated.commissionOverridden).toBe(true);
  });

  it("عمولة يدوية تساوي الحساب التلقائي لا تُعدّ تجاوزًا", async () => {
    const driver = await newDriver();
    const order = await createOrder({
      date: "2026-10-17",
      driverId: driver.id,
      amount: 1500,
      commissionAmount: 300,
    });
    expect(order.commissionOverridden).toBe(false);
  });

  it("يقفل الطلبية المغلقة: لا مبالغ ولا حذف، لكن الملاحظات مسموحة", async () => {
    const driver = await newDriver();
    const order = await createOrder({
      date: "2026-10-17",
      driverId: driver.id,
      amount: 1500,
    });
    await db.orders.update(order.id, {
      commissionClosed: true,
      settlementId: crypto.randomUUID(),
    });

    await expect(updateOrder(order.id, { amount: 2000 })).rejects.toMatchObject(
      {
        code: "ORDER_LOCKED",
      },
    );
    await expect(deleteOrder(order.id)).rejects.toMatchObject({
      code: "ORDER_LOCKED",
    });

    const updated = await updateOrder(order.id, { notes: "ملاحظة" });
    expect(updated.notes).toBe("ملاحظة");
  });

  it("الحذف ناعم: يبقى السجل ويُعلَّم محذوفًا ويُدرج في الطابور", async () => {
    const driver = await newDriver();
    const order = await createOrder({
      date: "2026-10-17",
      driverId: driver.id,
      amount: 1500,
    });

    await deleteOrder(order.id);

    const stored = await db.orders.get(order.id);
    expect(stored?.deletedAt).not.toBeNull();
    await expect(updateOrder(order.id, { notes: "x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
