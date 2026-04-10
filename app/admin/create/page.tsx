"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Subject, Module } from "@/lib/types";
import { saveCourse } from "@/lib/courses-store";

interface ParseResult {
  subject: Subject;
  modules: Module[];
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [rawContent, setRawContent] = useState("");
  const [moduleCount, setModuleCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);

  async function handleParse() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/courses/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_content: rawContent,
          desired_module_count: moduleCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "拆解失敗");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!result) return;
    saveCourse(result.subject, result.modules);
    router.push(`/subjects/${result.subject.subject_id}`);
  }

  return (
    <div>
      <Link href="/" className="text-sm text-blue-500 hover:underline">
        &larr; 回到首頁
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">建立新課程</h1>
      <p className="text-gray-500 mb-6">
        貼入你的學習內容，AI 會自動拆解成模組與任務。
      </p>

      {/* 輸入區 */}
      {!result && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              想要拆成幾個模組？
            </label>
            <select
              value={moduleCount}
              onChange={(e) => setModuleCount(Number(e.target.value))}
              className="border border-gray-200 rounded p-2 text-sm"
              disabled={loading}
            >
              <option value={1}>1 個模組</option>
              <option value={2}>2 個模組</option>
              <option value={3}>3 個模組</option>
              <option value={4}>4 個模組</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              課程內容
            </label>
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              disabled={loading}
              placeholder="貼入你想教的內容，例如：一篇文章、教材、知識點摘要... 至少 50 字"
              className="w-full border border-gray-200 rounded p-3 text-sm min-h-[300px] disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              目前 {rawContent.length} 字
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={loading || rawContent.length < 50}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "AI 正在拆解中（約 10-30 秒）..." : "開始拆解"}
          </button>
        </div>
      )}

      {/* 預覽區 */}
      {result && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium mb-1">拆解完成！</p>
            <p className="text-sm text-green-600">
              預覽下方內容，確認無誤後按「儲存並開始學習」
            </p>
          </div>

          {/* Subject 預覽 */}
          <div>
            <h2 className="text-lg font-semibold mb-2">主題</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold mb-1">{result.subject.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {result.subject.description}
              </p>
              {result.subject.tags && (
                <div className="flex gap-2">
                  {result.subject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modules 預覽 */}
          <div>
            <h2 className="text-lg font-semibold mb-2">
              模組（{result.modules.length}）
            </h2>
            <div className="space-y-3">
              {result.modules.map((mod) => (
                <div
                  key={mod.module_id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-medium mb-1">
                    {mod.order}. {mod.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{mod.description}</p>
                  <p className="text-xs text-gray-400">
                    {mod.tasks?.length || 0} 個任務
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              儲存並開始學習
            </button>
            <button
              onClick={() => setResult(null)}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              重新拆解
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
