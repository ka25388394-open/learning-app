"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Module, StepResult } from "@/lib/types";
import { STEP_KEYS, STEP_LABELS } from "@/lib/types";
import { saveTaskAttempt, getTaskProgress, canRetry } from "@/lib/progress";
import { evaluateStep } from "@/lib/services/evaluation-service";
import { calculateTaskScore } from "@/lib/services/validation-service";
import StepRenderer from "@/components/StepRenderer";

export default function TaskPage() {
  const { subjectId, moduleId, taskId } = useParams<{
    subjectId: string;
    moduleId: string;
    taskId: string;
  }>();
  const router = useRouter();

  const [mod, setMod] = useState<Module | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<Record<string, StepResult>>({});
  const [stepRetries, setStepRetries] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/modules/${subjectId}/${moduleId}`)
      .then((r) => r.json())
      .then(setMod);
  }, [subjectId, moduleId]);

  if (!mod) return <p className="text-gray-400">載入中...</p>;

  const task = mod.tasks.find((t) => t.task_id === taskId);
  if (!task) return <p className="text-red-500">找不到任務</p>;

  const retryLimit = mod.transition.on_fail.retry_limit;
  const taskProgress = getTaskProgress(subjectId, moduleId, taskId);
  const retriesLeft = retryLimit ? retryLimit - taskProgress.current_attempt : null;

  if (retryLimit && !canRetry(subjectId, moduleId, taskId, retryLimit)) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-xl font-bold mb-2">已達重試上限</h2>
        <p className="text-gray-600 mb-4">
          此任務最多可嘗試 {retryLimit} 次，你已用完所有機會。
        </p>
        <a href={`/subjects/${subjectId}/modules/${moduleId}`} className="text-blue-500 hover:underline text-sm">
          回到模組頁面
        </a>
      </div>
    );
  }

  const currentKey = STEP_KEYS[currentStepIndex];
  const currentStep = task.steps[currentKey];
  const totalSteps = STEP_KEYS.length;

  function handleSubmit(response: string) {
    const result = evaluateStep(currentStep, response);
    // evaluateStep 可能回傳 Promise（AI 評估），處理兩種情況
    if (result instanceof Promise) {
      result.then((r) => setStepResults((prev) => ({ ...prev, [currentKey]: r })));
    } else {
      setStepResults((prev) => ({ ...prev, [currentKey]: result }));
    }
  }

  function handleNext() {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // 用 validation-service 計算分數
      const stepEvaluations: Record<string, string> = {};
      STEP_KEYS.forEach((key) => {
        stepEvaluations[key] = task!.steps[key].evaluation;
      });

      const { score, passed, failedSteps } = calculateTaskScore(
        stepResults,
        stepEvaluations,
        mod!.validation.min_score
      );

      saveTaskAttempt(subjectId, moduleId, taskId, stepResults, score, passed);

      const failedParam = failedSteps.length > 0 ? `&failed=${failedSteps.join(",")}` : "";
      router.push(
        `/subjects/${subjectId}/modules/${moduleId}/tasks/${taskId}/result?passed=${passed}&score=${Math.round(score * 100)}${failedParam}`
      );
    }
  }

  function handleRetry() {
    setStepRetries((prev) => ({
      ...prev,
      [currentKey]: (prev[currentKey] || 0) + 1,
    }));
    setStepResults((prev) => {
      const next = { ...prev };
      delete next[currentKey];
      return next;
    });
  }

  const currentResult = stepResults[currentKey] || null;
  const currentRetryCount = stepRetries[currentKey] || 0;
  // 可以繼續的條件：已提交且（通過 或 已用完重試 或 選了「看答案」）
  const canProceed = !!currentResult;

  return (
    <div>
      {taskProgress.current_attempt > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
          第 {taskProgress.current_attempt + 1} 次嘗試
          {retriesLeft !== null && `（剩餘 ${retriesLeft} 次機會）`}
        </div>
      )}

      <div className="flex items-center gap-1 mb-6">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex-1 flex flex-col items-center">
            <div
              className={`h-1.5 w-full rounded-full ${
                i < currentStepIndex
                  ? "bg-blue-500"
                  : i === currentStepIndex
                    ? "bg-blue-300"
                    : "bg-gray-200"
              }`}
            />
            <span className="text-[10px] text-gray-400 mt-1">{STEP_LABELS[key]}</span>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-1">{task.title}</h2>
      <p className="text-sm text-gray-500 mb-6">步驟 {currentStepIndex + 1} / {totalSteps}</p>

      <StepRenderer
        stepKey={currentKey}
        step={currentStep}
        onSubmit={handleSubmit}
        result={currentResult}
        onRetry={handleRetry}
        retryCount={currentRetryCount}
      />

      {canProceed && (
        <button
          onClick={handleNext}
          className="mt-6 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 text-sm"
        >
          {currentStepIndex < totalSteps - 1 ? "下一步" : "查看結果"}
        </button>
      )}
    </div>
  );
}
