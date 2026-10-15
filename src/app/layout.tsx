import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
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
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-sans antialiased bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}
      >
        {children}
      </body>
    </html>
  );
}