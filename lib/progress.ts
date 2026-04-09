"use client";

import type {
  ModuleProgress,
  TaskProgress,
  AttemptRecord,
  ProgressStatus,
  StepKey,
  StepResult,
} from "./types";

const STORAGE_KEY = "learning-progress";

// --------------- 底層讀寫 ---------------

export function getAllProgress(): Record<string, Record<string, ModuleProgress>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // 如果舊資料格式不對，清掉重來
    if (typeof parsed !== "object" || parsed === null) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function saveAllProgress(data: Record<string, Record<string, ModuleProgress>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureModule(
  all: Record<string, Record<string, ModuleProgress>>,
  subjectId: string,
  moduleId: string
): ModuleProgress {
  if (!all[subjectId]) all[subjectId] = {};
  if (!all[subjectId][moduleId]) {
    all[subjectId][moduleId] = { status: "locked", attempt_count: 0, task_results: {} };
  }
  return all[subjectId][moduleId];
}

function ensureTask(mod: ModuleProgress, taskId: string): TaskProgress {
  const existing = mod.task_results[taskId];
  if (!existing || !("attempts" in existing)) {
    // 舊格式或不存在，初始化新結構
    mod.task_results[taskId] = {
      current_attempt: 0,
      best_score: 0,
      passed: false,
      attempts: [],
    };
  }
  return mod.task_results[taskId];
}

// --------------- 讀取 ---------------

export function getModuleProgress(subjectId: string, moduleId: string): ModuleProgress {
  const all = getAllProgress();
  return (
    all[subjectId]?.[moduleId] ?? {
      status: "locked",
      attempt_count: 0,
      task_results: {},
    }
  );
}

export function getTaskProgress(
  subjectId: string,
  moduleId: string,
  taskId: string
): TaskProgress {
  const mod = getModuleProgress(subjectId, moduleId);
  const existing = mod.task_results[taskId];
  // 處理舊格式或不存在的情況
  if (!existing || !("attempts" in existing)) {
    return {
      current_attempt: 0,
      best_score: 0,
      passed: false,
      attempts: [],
    };
  }
  return existing;
}

// --------------- 寫入 ---------------

export function setModuleStatus(subjectId: string, moduleId: string, status: ProgressStatus) {
  const all = getAllProgress();
  ensureModule(all, subjectId, moduleId).status = status;
  saveAllProgress(all);
}

export function saveTaskAttempt(
  subjectId: string,
  moduleId: string,
  taskId: string,
  stepResults: Record<string, StepResult>,
  score: number,
  passed: boolean
) {
  const all = getAllProgress();
  const mod = ensureModule(all, subjectId, moduleId);
  const task = ensureTask(mod, taskId);

  task.current_attempt += 1;

  const record: AttemptRecord = {
    attempt_number: task.current_attempt,
    score,
    passed,
    submitted_at: new Date().toISOString(),
    step_results: stepResults as Record<StepKey, StepResult>,
  };

  task.attempts.push(record);

  if (passed) {
    task.passed = true;
  }
  if (score > task.best_score) {
    task.best_score = score;
  }

  saveAllProgress(all);
}

export function incrementAttempt(subjectId: string, moduleId: string) {
  const all = getAllProgress();
  const mod = ensureModule(all, subjectId, moduleId);
  mod.attempt_count += 1;
  saveAllProgress(all);
}

export function canRetry(
  subjectId: string,
  moduleId: string,
  taskId: string,
  retryLimit?: number
): boolean {
  if (retryLimit === undefined || retryLimit === null) return true;
  const task = getTaskProgress(subjectId, moduleId, taskId);
  return task.current_attempt < retryLimit;
}

// --------------- 模組級聚合 ---------------

export function checkModuleCompletion(
  subjectId: string,
  moduleId: string,
  taskIds: string[],
  minScore?: number
): { allPassed: boolean; completedCount: number; totalCount: number } {
  const mod = getModuleProgress(subjectId, moduleId);
  let completedCount = 0;
  const threshold = minScore ?? 0.6;

  for (const taskId of taskIds) {
    const task = mod.task_results[taskId];
    if (task && task.passed && task.best_score >= threshold) {
      completedCount++;
    }
  }

  return {
    allPassed: completedCount >= taskIds.length,
    completedCount,
    totalCount: taskIds.length,
  };
}

// --------------- 初始化 ---------------

export function initSubjectProgress(subjectId: string, moduleIds: string[]) {
  const all = getAllProgress();
  if (all[subjectId]) return;
  all[subjectId] = {};
  moduleIds.forEach((id, index) => {
    all[subjectId][id] = {
      status: index === 0 ? "available" : "locked",
      attempt_count: 0,
      task_results: {},
    };
  });
  saveAllProgress(all);
}

// --------------- 統計 ---------------

export function getSubjectStats(subjectId: string, moduleIds: string[]) {
  const all = getAllProgress();
  const subjectData = all[subjectId] ?? {};
  let completed = 0;
  for (const id of moduleIds) {
    if (subjectData[id]?.status === "completed") completed++;
  }
  return { completed, total: moduleIds.length };
}
