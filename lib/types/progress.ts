// 紀錄層型別 — 對應 localStorage / 未來資料庫
import type { StepKey } from "./content";

export type ProgressStatus = "locked" | "available" | "in_progress" | "completed" | "failed";

export interface ModuleProgress {
  status: ProgressStatus;
  attempt_count: number;
  task_results: Record<string, TaskProgress>;
}

export interface TaskProgress {
  current_attempt: number;
  best_score: number;
  passed: boolean;
  attempts: AttemptRecord[];
}

export interface AttemptRecord {
  attempt_number: number;
  score: number;
  passed: boolean;
  submitted_at: string;
  step_results: Record<StepKey, StepResult>;
}

export interface StepResult {
  response: string;
  passed: boolean;
  feedback: string;
}
