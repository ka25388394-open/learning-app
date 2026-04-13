import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "啟程",
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-blue-600">
            啟程
          </a>
          <div className="flex items-center gap-4">
            <a href="/settings/plan" className="text-sm text-gray-500 hover:text-gray-700">
              方案
            </a>
            <a href="/admin/dev" className="text-xs text-gray-400 hover:text-gray-600 font-mono">
              DEV
            </a>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
