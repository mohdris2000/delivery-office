import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

// Cairo يغطي العربية واللاتينية، ونعطيه اسم --font-sans الذي تعتمد عليه المكوّنات
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام مكتب الدليفري",
  description: "إدارة الطلبيات والسائقين والعمولات",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cn("font-sans", cairo.variable)}>
      <body className="antialiased">
        {children}
        <Toaster dir="rtl" position="top-center" />
      </body>
    </html>
  );
}
