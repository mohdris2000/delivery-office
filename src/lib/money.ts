/** كل المبالغ في النظام أعداد صحيحة بالأغورة: 15.00 ₪ = 1500 */
export type Agorot = number;

/** نسبة العمولة الافتراضية بالنقاط الأساسية: 2000 = 20% */
export const DEFAULT_COMMISSION_RATE_BP = 2000;

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (digit) =>
    String(ARABIC_INDIC_DIGITS.indexOf(digit)),
  );
}

/**
 * يحوّل نصًا يكتبه المستخدم ("15" أو "₪12.5" أو "١٥٫٥٠") إلى أغورة.
 * يرجع null إذا كان النص غير صالح (سالب، أكثر من خانتين عشريتين، حروف...).
 */
export function parseShekels(input: string): Agorot | null {
  const cleaned = normalizeDigits(input)
    .replace(/[₪\s]/g, "")
    .replace(/[,٫]/g, ".");

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const total = whole * 100 + fraction;

  return Number.isSafeInteger(total) ? total : null;
}

/** 1500 → "₪15.00" */
export function formatShekels(agorot: Agorot): string {
  const sign = agorot < 0 ? "-" : "";
  const abs = Math.abs(agorot);
  const whole = Math.trunc(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}₪${whole.toLocaleString("en-US")}.${fraction}`;
}

/** العمولة = المبلغ × النسبة، مقرّبة لأقرب أغورة. */
export function calcCommission(amount: Agorot, rateBp: number): Agorot {
  return Math.round((amount * rateBp) / 10_000);
}
