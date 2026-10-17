import { describe, expect, it } from "vitest";
import {
  addDays,
  dbDateFromISO,
  isoFromDbDate,
  startOfWeek,
  toISODate,
} from "./dates";

describe("startOfWeek (الأسبوع يبدأ من السبت)", () => {
  it("السبت هو بداية أسبوعه", () => {
    expect(startOfWeek("2026-10-17")).toBe("2026-10-17");
  });

  it("الأحد والجمعة ينتميان للأسبوع الذي بدأ السبت", () => {
    expect(startOfWeek("2026-10-18")).toBe("2026-10-17");
    expect(startOfWeek("2026-10-23")).toBe("2026-10-17");
  });

  it("السبت التالي يبدأ أسبوعًا جديدًا", () => {
    expect(startOfWeek("2026-10-24")).toBe("2026-10-24");
  });
});

describe("addDays", () => {
  it("يعبر حدود الأشهر والسنوات", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("toISODate", () => {
  it("يستخدم التاريخ المحلي", () => {
    expect(toISODate(new Date(2026, 9, 17))).toBe("2026-10-17");
  });
});

describe("التحويل من/إلى عمود @db.Date", () => {
  it("لا يتغير اليوم عند الذهاب والعودة", () => {
    expect(isoFromDbDate(dbDateFromISO("2026-08-24"))).toBe("2026-08-24");
  });
});
