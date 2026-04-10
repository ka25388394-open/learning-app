"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { Module } from "@/lib/types";
import { STEP_LABELS, type StepKey } from "@/lib/types";
import {
  setModuleStatus,
  incrementAttempt,
  checkModuleCompletion,
  getTaskProgress,
  canRetry,
} from "@/lib/progress";
import { loadModule, loadSubject } from "@/lib/course-loader";

export default function ResultPage() {
  const { subjectId, moduleId, taskId } = useParams<{
    subjectId: string;
    moduleId: string;
    taskId: string;
  }>();
  const searchParams = useSearchParams();
  const passed = searchParams.get("passed") === "true";
  const score = searchParams.get("score") || "0";
  const failedStepsParam = searchParams.get("failed") || "";
  const failedSteps = failedStepsParam
    ? (failedStepsParam.split(",") as StepKey[])
    : [];

  const [mod, setMod] = useState<Module | null>(null);
  const [processed, setProcessed] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  useEffect(() => {
    loadModule(subjectId, moduleId).then(setMod);
  }, [subjectId, moduleId]);

  // 處理進度更新（只執行一次）
  useEffect(() => {
    if (!mod || processed) return;

    if (passed) {
      // 檢查模組內所有任務是否都通過
      const taskIds = mod.tasks.map((t) => t.task_id);
      const { allPassed } = checkModuleCompletion(
        subjectId,
        moduleId,
        taskIds,
        mod.validation.min_score
      );

      if (allPassed) {
        setModuleStatus(subjectId, moduleId, "completed");
        setModuleCompleted(true);

        // 解鎖下一模組
        if (mod.transition.on_pass.action === "unlock_next") {
          loadSubject(subjectId).then((data) => {
            if (!data) return;
            const modules: string[] = data.subject.modules;
            const currentIndex = modules.indexOf(moduleId);
            if (currentIndex >= 0 && currentIndex < modules.length - 1) {
              const nextModuleId = modules[currentIndex + 1];
              setModuleStatus(subjectId, nextModuleId, "available");
            }
          });
        }
      }
    } else {
      incrementAttempt(subjectId, moduleId);
    }

    setProcessed(true);
  }, [mod, passed, processed, subjectId, moduleId]);

  if (!mod) return <p className="text-gray-400">載入中...</p>;

  const transitionMessage = passed
    ? moduleCompleted
      ? mod.transition.on_pass.message
      : null
    : mod.transition.on_fail.message;

  const currentTaskIndex = mod.tasks.findIndex((t) => t.task_id === taskId);
  const hasNextTask = currentTaskIndex < mod.tasks.length - 1;
  const nextTask = hasNextTask ? mod.tasks[currentTaskIndex + 1] : null;

  // 重試檢查
  const retryLimit = mod.transition.on_fail.retry_limit;
  const canRetryTask = !passed && canRetry(subjectId, moduleId, taskId, retryLimit);
  const taskProgress = getTaskProgress(subjectId, moduleId, taskId);

  return (
    <div className="text-center py-8">
      {/* 圖示 */}
      <div
        className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
          passed ? "bg-green-100" : "bg-red-100"
        }`}
      >
        <span className="text-4xl">{passed ? "\u2713" : "\u2717"}</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {passed
          ? moduleCompleted
            ? "模組完成！"
            : "任務通過！"
          : "尚未通過"}
      </h1>

      <p className="text-gray-600 mb-2">得分：{score}%</p>

      {/* 嘗試次數 */}
      <p className="text-xs text-gray-400 mb-4">
        此任務已嘗試 {taskProgress.current_attempt} 次
        {retryLimit ? ` / 上限 ${retryLimit} 次` : ""}
      </p>

      {/* 未通過原因 */}
      {!passed && failedSteps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
          <p className="font-medium text-red-700 mb-2">未通過的步驟：</p>
          <ul className="text-sm text-red-600 space-y-1">
            {failedSteps.map((key) => (
              <li key={key}>
                - {STEP_LABELS[key]}：
                {mod.tasks[currentTaskIndex]?.steps[key]?.hint || "答案不正確"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {transitionMessage && (
        <p className="text-gray-700 bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
          {transitionMessage}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        {/* 通過 → 還有下一任務 */}
        {passed && hasNextTask && nextTask && (
          <Link
            href={`/subjects/${subjectId}/modules/${moduleId}/tasks/${nextTask.task_id}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            前往下一個任務：{nextTask.title}
          </Link>
        )}

        {/* 通過 + 模組完成 → 進入過渡頁 */}
        {passed && moduleCompleted && (
          <Link
            href={`/subjects/${subjectId}/modules/${moduleId}/transition`}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            繼續
          </Link>
        )}

        {/* 通過但模組尚未完成（無下一任務的邊界情況） */}
        {passed && !hasNextTask && !moduleCompleted && (
          <Link
            href={`/subjects/${subjectId}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            回到模組列表
          </Link>
        )}

        {/* 未通過 + 可重試 */}
        {canRetryTask && (
          <Link
            href={`/subjects/${subjectId}/modules/${moduleId}/tasks/${taskId}`}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition"
          >
            重新挑戰
            {retryLimit
              ? `（剩餘 ${retryLimit - taskProgress.current_attempt} 次）`
              : ""}
          </Link>
        )}

        {/* 未通過 + 不可重試 */}
        {!passed && !canRetryTask && (
          <p className="text-red-600 font-medium">已達重試上限，無法再嘗試此任務。</p>
        )}

        <Link
          href={`/subjects/${subjectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          回到模組列表
        </Link>
      </div>
    </div>
  );
}
