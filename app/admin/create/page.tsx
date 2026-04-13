"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Subject, Module } from "@/lib/types";
import { saveCourse } from "@/lib/courses-store";
import { getTier } from "@/lib/tier-store";

interface SplitModule {
  title: string;
  summary: string;
  key_points: string[];
  order: number;
}

interface SplitResult {
  title: string;
  description: string;
  modules: SplitModule[];
}

interface ParseResult {
  subject: Subject;
  modules: Module[];
}

type Step = "input" | "split" | "design" | "preview";

export default function CreateCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [rawContent, setRawContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 拆分結果
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  // 設計結果
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  // 正在設計第幾個模組
  const [designProgress, setDesignProgress] = useState(0);

  const tier = typeof window !== "undefined" ? getTier() : "free";

  // 第一步：拆分
  async function handleSplit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/courses/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_content: rawContent, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSplitResult(data);
      setStep("split");
    } catch (err) {
      setError(err instanceof Error ? err.message : "拆分失敗");
    }
    setLoading(false);
  }

  // 第二步：逐一設計每個模組
  async function handleDesignAll() {
    if (!splitResult) return;
    setStep("design");
    setLoading(true);
    setError(null);

    try {
      // 把拆分結果組成一段文字讓設計 AI 處理
      const contentForDesign = splitResult.modules
        .map(
          (m) =>
            `## ${m.title}\n${m.summary}\n重點：${m.key_points.join("、")}`
        )
        .join("\n\n");

      const res = await fetch("/api/courses/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_content: contentForDesign,
          desired_module_count: splitResult.modules.length,
          tier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 覆蓋 subject 的標題用拆分結果的
      data.subject.title = splitResult.title;
      data.subject.description = splitResult.description;

      setParseResult(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "設計失敗");
      setStep("split");
    }
    setLoading(false);
  }

  function handleSave() {
    if (!parseResult) return;
    saveCourse(parseResult.subject, parseResult.modules);
    router.push(`/subjects/${parseResult.subject.subject_id}`);
  }

  return (
    <div>
      <Link href="/" className="text-sm text-blue-500 hover:underline">
        &larr; 回到首頁
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">建立新課程</h1>

      {/* 流程指示 */}
      <div className="flex gap-1.5 mb-6">
        {(["input", "split", "design", "preview"] as Step[]).map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div
              className={`h-1.5 w-full rounded-full transition ${
                (["input", "split", "design", "preview"] as Step[]).indexOf(step) >= i
                  ? "bg-blue-500"
                  : "bg-gray-200"
              }`}
            />
            <span className="text-[10px] text-gray-400 mt-1">
              {["貼內容", "拆模組", "設計中", "預覽"][i]}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── 第一步：貼內容 ── */}
      {step === "input" && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            貼入你想學的內容，AI 會先幫你拆成不同模組。
          </p>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            disabled={loading}
            placeholder="貼入文章、教材、筆記... 建議 500-1500 字效果最好"
            className="w-full border border-gray-200 rounded-lg p-4 text-sm min-h-[250px] disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-400">目前 {rawContent.length} 字</p>
          <button
            onClick={handleSplit}
            disabled={loading || rawContent.length < 50}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "AI 正在分析..." : "開始拆分"}
          </button>
        </div>
      )}

      {/* ── 第二步：確認拆分結果 ── */}
      {step === "split" && splitResult && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <p className="text-green-700 font-medium">{splitResult.title}</p>
            <p className="text-sm text-green-600">{splitResult.description}</p>
          </div>

          <h2 className="font-semibold">
            AI 建議拆成 {splitResult.modules.length} 個模組：
          </h2>

          <div className="space-y-3">
            {splitResult.modules.map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-1">
                  {m.order}. {m.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{m.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {m.key_points.map((kp, j) => (
                    <span
                      key={j}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {kp}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDesignAll}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              確認，開始設計課程
            </button>
            <button
              onClick={() => { setStep("input"); setSplitResult(null); }}
              className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              重新拆分
            </button>
          </div>
        </div>
      )}

      {/* ── 第三步：設計中 ── */}
      {step === "design" && (
        <div className="text-center py-12">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">&#9881;</span>
            </div>
          </div>
          <p className="text-gray-600 font-medium">AI 正在設計課程內容...</p>
          <p className="text-sm text-gray-400 mt-2">
            包含情境引導、題目、補充說明，需要 15-30 秒
          </p>
        </div>
      )}

      {/* ── 第四步：預覽 ── */}
      {step === "preview" && parseResult && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium mb-1">課程設計完成！</p>
            <p className="text-sm text-green-600">
              確認無誤後按「儲存」即可開始學習
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              {parseResult.subject.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {parseResult.subject.description}
            </p>
          </div>

          <div className="space-y-3">
            {parseResult.modules.map((mod) => (
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

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              儲存並開始學習
            </button>
            <button
              onClick={() => { setStep("input"); setSplitResult(null); setParseResult(null); }}
              className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              重新來過
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
