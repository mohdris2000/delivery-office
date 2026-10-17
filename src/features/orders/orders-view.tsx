"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsClient } from "@/hooks/use-is-client";
import { weekdayNameAr } from "@/lib/dates";
import { db } from "@/local/db";
import { errorMessage } from "@/local/errors";
import { deleteOrder } from "@/local/orders";
import type { Order } from "@/local/types";
import { OrderForm } from "./order-form";

function groupByDate(orders: Order[]) {
  const groups: { date: string; orders: Order[] }[] = [];
  for (const order of orders) {
    const last = groups.at(-1);
    if (last && last.date === order.date) last.orders.push(order);
    else groups.push({ date: order.date, orders: [order] });
  }
  return groups;
}

export function OrdersView() {
  const isClient = useIsClient();

  const data = useLiveQuery(async () => {
    const [orders, drivers] = await Promise.all([
      db.orders
        .orderBy("date")
        .reverse()
        .filter((order) => order.deletedAt === null)
        .limit(200)
        .toArray(),
      db.drivers.toArray(),
    ]);

    orders.sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt),
    );

    return { orders, names: new Map(drivers.map((d) => [d.id, d.name])) };
  }, []);

  async function onDelete(order: Order) {
    if (!window.confirm("حذف هذه الطلبية؟")) return;
    try {
      await deleteOrder(order.id);
      toast.success("تم حذف الطلبية");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الطلبيات</h1>

      {isClient && <OrderForm />}

      {data === undefined && (
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      )}
      {data?.orders.length === 0 && (
        <p className="text-muted-foreground">لا توجد طلبيات بعد.</p>
      )}

      {data &&
        groupByDate(data.orders).map((group) => (
          <section key={group.date} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {weekdayNameAr(group.date)} <bdi dir="ltr">{group.date}</bdi>
            </h2>

            {group.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="font-semibold">
                      {data.names.get(order.driverId) ?? "سائق غير معروف"}
                    </div>
                    {order.details && (
                      <div className="text-sm text-muted-foreground">
                        {order.details}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {!order.fareReceived && (
                        <Badge variant="destructive">الأجرة غير مستلمة</Badge>
                      )}
                      <Badge
                        variant={
                          order.commissionClosed ? "secondary" : "outline"
                        }
                      >
                        {order.commissionClosed
                          ? "العمولة مغلقة"
                          : "العمولة مستحقة"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <Money
                        value={order.amount}
                        className="block font-semibold"
                      />
                      <span className="text-xs text-muted-foreground">
                        عمولة <Money value={order.commissionAmount} />
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={order.commissionClosed}
                      onClick={() => onDelete(order)}
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ))}
    </div>
  );
}
