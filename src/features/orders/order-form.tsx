"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidISODate, todayISO, weekdayNameAr } from "@/lib/dates";
import {
  calcCommission,
  DEFAULT_COMMISSION_RATE_BP,
  parseShekels,
} from "@/lib/money";
import { db } from "@/local/db";
import { errorMessage } from "@/local/errors";
import { createOrder } from "@/local/orders";

export function OrderForm() {
  const drivers = useLiveQuery(async () => {
    const active = await db.drivers
      .filter((d) => d.deletedAt === null && d.isActive)
      .toArray();
    return active.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, []);

  const amountRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(todayISO);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [amountText, setAmountText] = useState("");
  const [fareReceived, setFareReceived] = useState(true);
  const [commissionText, setCommissionText] = useState("");
  const [commissionClosed, setCommissionClosed] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amount = parseShekels(amountText);
  const autoCommission =
    amount && amount > 0
      ? calcCommission(amount, DEFAULT_COMMISSION_RATE_BP)
      : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!driverId) return setError("اختر السائق");
    if (amount === null || amount <= 0) return setError("أدخل مبلغًا صحيحًا");

    let commissionAmount: number | undefined;
    if (commissionText.trim()) {
      const parsed = parseShekels(commissionText);
      if (parsed === null) return setError("العمولة غير صالحة");
      commissionAmount = parsed;
    }

    setSaving(true);
    try {
      await createOrder({
        date,
        driverId,
        amount,
        details,
        notes,
        fareReceived,
        commissionAmount,
        commissionClosed,
      });
      toast.success("تمت إضافة الطلبية");

      // نبقي السائق والتاريخ لإدخال الطلبية التالية بسرعة
      setDetails("");
      setAmountText("");
      setFareReceived(true);
      setCommissionText("");
      setCommissionClosed(false);
      setNotes("");
      amountRef.current?.focus();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>طلبية جديدة</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <span className="text-sm font-medium">السائق</span>
            {drivers === undefined ? (
              <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
            ) : drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا يوجد سائقون نشطون.{" "}
                <Link href="/drivers" className="underline">
                  أضف سائقًا
                </Link>
              </p>
            ) : (
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="اختيار السائق"
              >
                {drivers.map((driver) => (
                  <Button
                    key={driver.id}
                    type="button"
                    size="sm"
                    variant={driverId === driver.id ? "default" : "outline"}
                    aria-pressed={driverId === driver.id}
                    onClick={() => setDriverId(driver.id)}
                  >
                    {driver.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order-date">
                التاريخ
                {isValidISODate(date) && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    ({weekdayNameAr(date)})
                  </span>
                )}
              </Label>
              <Input
                id="order-date"
                type="date"
                dir="ltr"
                className="text-start"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-amount">المبلغ (₪)</Label>
              <Input
                id="order-amount"
                ref={amountRef}
                inputMode="decimal"
                dir="ltr"
                className="text-start"
                autoComplete="off"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                required
              />
              {autoCommission !== null && (
                <p className="text-xs text-muted-foreground">
                  العمولة: <Money value={autoCommission} />
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-details">البيان (اختياري)</Label>
              <Input
                id="order-details"
                autoComplete="off"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">أجرة الطلبية</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={fareReceived ? "default" : "outline"}
                aria-pressed={fareReceived}
                onClick={() => setFareReceived(true)}
              >
                مستلمة
              </Button>
              <Button
                type="button"
                variant={!fareReceived ? "destructive" : "outline"}
                aria-pressed={!fareReceived}
                onClick={() => setFareReceived(false)}
              >
                غير مستلمة
              </Button>
            </div>
          </div>

          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              خيارات إضافية
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order-commission">
                  عمولة يدوية (فارغ = تلقائي)
                </Label>
                <Input
                  id="order-commission"
                  inputMode="decimal"
                  dir="ltr"
                  className="text-start"
                  autoComplete="off"
                  placeholder={
                    autoCommission !== null
                      ? String(autoCommission / 100)
                      : undefined
                  }
                  value={commissionText}
                  onChange={(e) => setCommissionText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">عمولة الكابتن</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!commissionClosed ? "default" : "outline"}
                    aria-pressed={!commissionClosed}
                    onClick={() => setCommissionClosed(false)}
                  >
                    مستحقة
                  </Button>
                  <Button
                    type="button"
                    variant={commissionClosed ? "default" : "outline"}
                    aria-pressed={commissionClosed}
                    onClick={() => setCommissionClosed(true)}
                  >
                    مغلقة
                  </Button>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="order-notes">ملاحظات</Label>
                <Textarea
                  id="order-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </details>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ الطلبية"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
