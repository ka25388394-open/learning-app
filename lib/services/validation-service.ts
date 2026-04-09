// 模組/任務通過判定服務
// 純規則型邏輯，未來可加入 AI override

import type { StepKey, StepResult, ValidationRule } from "@/lib/types";
import { STEP_KEYS } from "@/lib/types";

interface TaskScore {
  score: number;
  passed: boolean;
  failedSteps: StepKey[];
}

export function calculateTaskScore(
  stepResults: Record<string, StepResult>,
  stepEvaluations: Record<string, string>, // stepKey -> evaluation type
  minScore: number = 0.6
): TaskScore {
  let passedCount = 0;
  let totalEvaluated = 0;
  const failedSteps: StepKey[] = [];

  STEP_KEYS.forEach((key) => {
    const result = stepResults[key];
    if (!result) return;

    // always_pass 步驟不計入分數
    if (stepEvaluations[key] === "always_pass") return;

    totalEvaluated++;
    if (result.passed) {
      passedCount++;
    } else {
      failedSteps.push(key);
    }
  });

  const score = totalEvaluated > 0 ? passedCount / totalEvaluated : 1;
  const passed = score >= minScore;

  return { score, passed, failedSteps };
}

export function checkModuleComplete(
  taskResults: Record<string, { passed: boolean; best_score: number }>,
  taskIds: string[],
  validation: ValidationRule
): boolean {
  const threshold = validation.min_score ?? 0.6;
  let completedCount = 0;

  for (const taskId of taskIds) {
    const task = taskResults[taskId];
    if (task && task.passed && task.best_score >= threshold) {
      completedCount++;
    }
  }

  const required =
    validation.min_tasks_completed === "all"
      ? taskIds.length
      : validation.min_tasks_completed;

  return completedCount >= required;
}
