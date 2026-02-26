import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Feed",
  description: "Внутренняя лента фреймов и скриншотов от дизайн-команды",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
