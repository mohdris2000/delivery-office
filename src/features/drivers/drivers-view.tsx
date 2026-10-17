"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/local/db";
import { createDriver, setDriverActive } from "@/local/drivers";
import { DomainError } from "@/local/errors";

function messageOf(error: unknown): string {
  return error instanceof DomainError ? error.message : "حدث خطأ غير متوقع";
}

export function DriversView() {
  const drivers = useLiveQuery(async () => {
    const all = await db.drivers.filter((d) => d.deletedAt === null).toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, []);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createDriver({
        name,
        address,
        phones: phone.trim() ? [phone] : [],
      });
      setName("");
      setAddress("");
      setPhone("");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setError(null);
    try {
      await setDriverActive(id, !isActive);
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">السائقون</h1>

      <Card>
        <CardHeader>
          <CardTitle>إضافة سائق</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="driver-name">الاسم</Label>
              <Input
                id="driver-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-address">العنوان</Label>
              <Input
                id="driver-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-phone">رقم الجوال (اختياري)</Label>
              <Input
                id="driver-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className="text-start"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-destructive sm:col-span-3"
              >
                {error}
              </p>
            )}

            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "حفظ السائق"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {drivers === undefined && (
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        )}
        {drivers?.length === 0 && (
          <p className="text-muted-foreground">لا يوجد سائقون بعد.</p>
        )}
        {drivers?.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{driver.name}</span>
                  <Badge variant={driver.isActive ? "secondary" : "outline"}>
                    {driver.isActive ? "نشط" : "معطّل"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {driver.address}
                  {driver.phones.length > 0 && (
                    <>
                      {" · "}
                      <span dir="ltr">{driver.phones.join(" / ")}</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive(driver.id, driver.isActive)}
              >
                {driver.isActive ? "تعطيل" : "تفعيل"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
