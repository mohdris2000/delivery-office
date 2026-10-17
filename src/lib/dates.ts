/** التاريخ (بدون وقت) يُمثَّل بنص "YYYY-MM-DD" في كل أجزاء التطبيق. */
export type ISODate = string;

export function toISODate(date: Date): ISODate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** تاريخ اليوم بالتوقيت المحلي للجهاز. */
export function todayISO(): ISODate {
  return toISODate(new Date());
}

/** منتصف الليل المحلي لهذا التاريخ. */
export function parseISODate(iso: ISODate): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** بداية الأسبوع: السبت. */
export function startOfWeek(iso: ISODate): ISODate {
  const date = parseISODate(iso);
  // getDay(): 0 = الأحد ... 6 = السبت
  const daysSinceSaturday = (date.getDay() + 1) % 7;
  return addDays(iso, -daysSinceSaturday);
}

/** اسم اليوم بالعربية، مثل "الإثنين". */
export function weekdayNameAr(iso: ISODate): string {
  return new Intl.DateTimeFormat("ar", { weekday: "long" }).format(
    parseISODate(iso),
  );
}

/** عمود @db.Date في Prisma يعود كـDate عند منتصف الليل UTC. */
export function isoFromDbDate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

/** عكس الدالة السابقة: للكتابة في عمود @db.Date. */
export function dbDateFromISO(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** يتحقق أن النص تاريخ حقيقي بصيغة YYYY-MM-DD (يرفض مثل 2026-02-30). */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISODate(parseISODate(value)) === value;
}