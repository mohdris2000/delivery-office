import { describe, expect, it } from "vitest";
import { calcCommission, formatShekels, parseShekels } from "./money";

describe("parseShekels", () => {
  it("يقرأ الأعداد الصحيحة والعشرية", () => {
    expect(parseShekels("15")).toBe(1500);
    expect(parseShekels("12.5")).toBe(1250);
    expect(parseShekels("₪15.00")).toBe(1500);
    expect(parseShekels(" 20 ")).toBe(2000);
  });

  it("يقرأ الأرقام العربية والفاصلة العربية", () => {
    expect(parseShekels("١٥")).toBe(1500);
    expect(parseShekels("١٥٫٥")).toBe(1550);
  });

  it("يرفض المدخلات غير الصالحة", () => {
    expect(parseShekels("")).toBeNull();
    expect(parseShekels("abc")).toBeNull();
    expect(parseShekels("-5")).toBeNull();
    expect(parseShekels("1.234")).toBeNull();
  });
});

describe("formatShekels", () => {
  it("ينسّق المبالغ", () => {
    expect(formatShekels(1500)).toBe("₪15.00");
    expect(formatShekels(4340)).toBe("₪43.40");
    expect(formatShekels(0)).toBe("₪0.00");
    expect(formatShekels(123456)).toBe("₪1,234.56");
    expect(formatShekels(-250)).toBe("-₪2.50");
  });
});

describe("calcCommission", () => {
  it("يحسب 20%", () => {
    expect(calcCommission(1500, 2000)).toBe(300);
    expect(calcCommission(21700, 2000)).toBe(4340);
    expect(calcCommission(1250, 2000)).toBe(250);
  });

  it("يقرّب لأقرب أغورة", () => {
    expect(calcCommission(1001, 2000)).toBe(200);
    expect(calcCommission(1003, 2000)).toBe(201);
  });
});
