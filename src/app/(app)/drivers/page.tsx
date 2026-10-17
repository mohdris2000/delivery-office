import type { Metadata } from "next";
import { DriversView } from "@/features/drivers/drivers-view";

export const metadata: Metadata = { title: "السائقون | مكتب الدليفري" };

export default function DriversPage() {
  return <DriversView />;
}