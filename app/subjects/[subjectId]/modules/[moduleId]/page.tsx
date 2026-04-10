"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Module } from "@/lib/types";
import { setModuleStatus } from "@/lib/progress";
import { loadModule } from "@/lib/course-loader";

const INTRO_STEPS = ["hook", "context", "bridge", "ready"] as const;
type IntroStep = (typeof INTRO_STEPS)[number];

export default function ModuleDetailPage() {
  const { subjectId, moduleId } = useParams<{
    subjectId: string;
    moduleId: string;
  }>();
  const [mod, setMod] = useState<Module | null>(null);
  const [step, setStep] = useState<IntroStep>("hook");
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    loadModule(subjectId, moduleId).then(setMod);
  }, [subjectId, moduleId]);

  if (!mod) return <p className="text-gray-400">載入中...</p>;

  const stepIndex = INTRO_STEPS.indexOf(step);
  const intro = mod.intro;

  function next() {
    if (stepIndex < INTRO_STEPS.length - 1) {
      setStep(INTRO_STEPS[stepIndex + 1]);
    }
  }

  function prev() {
    if (stepIndex > 0) {
      setStep(INTRO_STEPS[stepIndex - 1]);
    }
  }

  function handleStart() {
    setModuleStatus(subjectId, moduleId, "in_progress");
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* 頂部 */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/subjects/${subjectId}`}
          className="text-sm text-blue-500 hover:underline"
        >
          &larr; 回到模組列表
        </Link>
        <div className="flex gap-1.5">
          {INTRO_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1.5 rounded-full transition ${
                stepIndex >= i ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 學習目標（摺疊） */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowGoals(!showGoals)}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          {showGoals ? "收起學習目標" : "查看學習目標"}
        </button>
      </div>
      {showGoals && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm">
          <p className="font-medium text-gray-500 mb-2">完成後你將能夠：</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {mod.goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 主要內容 */}
      <div className="flex-1 flex items-center">
        <div className="w-full">
          {/* ── 第一頁：開場提問 ── */}
          {step === "hook" && intro && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                模組 {mod.order}
              </p>
              <h1 className="text-2xl font-bold leading-relaxed mb-6">
                {intro.hook}
              </h1>
            </div>
          )}

          {/* ── 第二頁：情境共鳴 ── */}
          {step === "context" && intro && (
            <div>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {intro.context}
              </p>
              {/* 案例穿插在情境裡 */}
              {mod.examples && mod.examples.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">例如：</p>
                  {mod.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 border-l-4 border-blue-300 pl-4 py-3 text-sm text-gray-600"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 第三頁：過渡 + 預告 ── */}
          {step === "bridge" && intro && (
            <div>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {intro.bridge}
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                <p className="text-blue-800 leading-relaxed">
                  {intro.preview}
                </p>
              </div>
            </div>
          )}

          {/* ── 第四頁：準備開始 ── */}
          {step === "ready" && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-2">準備好了嗎？</p>
              <h1 className="text-2xl font-bold mb-8">{mod.title}</h1>

              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-500 mb-3">
                  接下來你會完成：
                </p>
                <div className="space-y-3">
                  {mod.tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center gap-3 text-sm text-gray-700"
                    >
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        {task.order}
                      </span>
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/subjects/${subjectId}/modules/${moduleId}/tasks/${mod.tasks[0].task_id}`}
                onClick={handleStart}
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-lg"
              >
                開始
              </Link>
            </div>
          )}

          {/* 沒有 intro 的 fallback */}
          {!intro && step !== "ready" && (
            <div>
              <h1 className="text-2xl font-bold mb-4">{mod.title}</h1>
              <p className="text-gray-700 mb-6">{mod.description}</p>
              <button
                onClick={() => setStep("ready")}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 text-sm"
              >
                繼續
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 底部導航 */}
      {step !== "ready" && (
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
          {stepIndex > 0 ? (
            <button
              onClick={prev}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; 上一步
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={next}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 text-sm"
          >
            繼續 &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
