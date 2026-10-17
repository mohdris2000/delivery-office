export type DomainErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "DUPLICATE_DRIVER_NAME"
  | "DRIVER_INACTIVE"
  | "ORDER_LOCKED";

/** أخطاء منطق العمل. الرسالة عربية وصالحة للعرض للمستخدم. */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof DomainError ? error.message : "حدث خطأ غير متوقع";
}
