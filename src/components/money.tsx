import { formatShekels } from "@/lib/money";

export function Money({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <bdi dir="ltr" className={className}>
      {formatShekels(value)}
    </bdi>
  );
}
