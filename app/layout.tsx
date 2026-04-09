import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "學習跑車",
  description: "流程型學習系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <a href="/" className="text-xl font-bold text-blue-600">
            學習跑車
          </a>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
