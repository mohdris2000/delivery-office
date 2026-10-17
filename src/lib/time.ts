/** الوقت الحالي بصيغة ISO (UTC) */
export function nowISO(): string {
  return new Date().toISOString();
}
