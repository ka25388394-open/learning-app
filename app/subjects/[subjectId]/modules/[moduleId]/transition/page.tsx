"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Module, Subject } from "@/lib/types";
import { loadModule, loadSubject } from "@/lib/course-loader";

const TRANSITION_STEPS = ["review", "challenge", "bridge", "next_preview"] as const;
type TransitionStep = (typeof TRANSITION_STEPS)[number];

const STEP_TITLES: Record<TransitionStep, string> = {
  review: "回顧",
  challenge: "接下來的挑戰",
  bridge: "你已經準備好了",
  next_preview: "下一步",
};

export default function TransitionPage() {
  const { subjectId, moduleId } = useParams<{
    subjectId: string;
    moduleId: string;
  }>();

  const [mod, setMod] = useState<Module | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [nextMod, setNextMod] = useState<Module | null>(null);
  const [step, setStep] = useState<TransitionStep>("review");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    loadModule(subjectId, moduleId).then(setMod);

    loadSubject(subjectId).then((data) => {
      if (!data) return;
      setSubject(data.subject);
      const modules = data.subject.modules;
      const currentIndex = modules.indexOf(moduleId);
      if (currentIndex >= 0 && currentIndex < modules.length - 1) {
        const nextId = modules[currentIndex + 1];
        loadModule(subjectId, nextId).then(setNextMod);
      }
    });
  }, [subjectId, moduleId]);

  if (!mod) return <p className="text-gray-400">載入中...</p>;

  const tc = mod.transition_content;
  if (!tc) {
    // 沒有過渡內容，直接跳回列表
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">模組完成！</h1>
        <Link
          href={`/subjects/${subjectId}`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          回到模組列表
        </Link>
      </div>
    );
  }

  const stepIndex = TRANSITION_STEPS.indexOf(step);
  const isLast = stepIndex === TRANSITION_STEPS.length - 1;

  function next() {
    if (!isLast) setStep(TRANSITION_STEPS[stepIndex + 1]);
  }
  function prev() {
    if (stepIndex > 0) setStep(TRANSITION_STEPS[stepIndex - 1]);
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* 頂部進度 */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-sm text-gray-400">模組完成</span>
        <div className="flex gap-1.5">
          {TRANSITION_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1.5 rounded-full transition ${
                stepIndex >= i ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 主要內容 */}
      <div className="flex-1 flex items-center">
        <div className="w-full">
          {/* ── 回顧 ── */}
          {step === "review" && (
            <div>
              <p className="text-sm text-green-600 font-medium mb-3">
                {STEP_TITLES.review}
              </p>
              <h1 className="text-2xl font-bold mb-6">
                你剛剛完成了：{mod.title}
              </h1>
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <p className="text-gray-700 leading-relaxed">{tc.review}</p>
              </div>
              {/* 完成的任務列表 */}
              <div className="space-y-2">
                {mod.tasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="flex items-center gap-3 text-sm text-gray-600"
                  >
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                      ✓
                    </span>
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 提問挑戰 ── */}
          {step === "challenge" && (
            <div>
              <p className="text-sm text-amber-600 font-medium mb-3">
                {STEP_TITLES.challenge}
              </p>
              <h1 className="text-2xl font-bold leading-relaxed mb-6">
                {tc.challenge}
              </h1>
            </div>
          )}

          {/* ── 過渡 ── */}
          {step === "bridge" && (
            <div>
              <p className="text-sm text-blue-600 font-medium mb-3">
                {STEP_TITLES.bridge}
              </p>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {tc.bridge}
                </p>
              </div>
            </div>
          )}

          {/* ── 預告下一模組 + AI 建議 ── */}
          {step === "next_preview" && (
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium mb-3">
                {STEP_TITLES.next_preview}
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6 text-left max-w-lg mx-auto">
                <p className="text-blue-800 leading-relaxed">
                  {tc.next_preview}
                </p>
              </div>

              {/* AI 個人化建議 */}
              {aiSuggestion && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-5 mb-6 text-left max-w-lg mx-auto">
                  <p className="text-xs text-green-500 mb-2">學習夥伴的話</p>
                  <p className="text-sm text-green-800 leading-relaxed">{aiSuggestion}</p>
                </div>
              )}
              {!aiSuggestion && subject && (
                <button
                  onClick={async () => {
                    try {
                      const completedModules = [mod!.title];
                      const availableModules = nextMod ? [nextMod.title] : [];
                      const res = await fetch("/api/courses/suggest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          completed_modules: completedModules,
                          available_modules: availableModules,
                          subject_title: subject.title,
                        }),
                      });
                      const data = await res.json();
                      setAiSuggestion(data.suggestion);
                    } catch {
                      setAiSuggestion("繼續保持，你做得很好！");
                    }
                  }}
                  className="text-sm text-green-500 hover:text-green-700 mb-6 block mx-auto"
                >
                  聽聽學習夥伴怎麼說
                </button>
              )}

              {nextMod ? (
                <Link
                  href={`/subjects/${subjectId}/modules/${nextMod.module_id}`}
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-lg"
                >
                  進入下一模組：{nextMod.title}
                </Link>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    你已完成這個主題的所有模組！
                  </p>
                  <Link
                    href={`/subjects/${subjectId}`}
                    className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition text-lg"
                  >
                    回到主題頁
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部導航 */}
      {!isLast && (
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
