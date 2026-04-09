// 內容層型別 — 對應 content/courses/ 下的 JSON 結構

export interface Subject {
  subject_id: string;
  title: string;
  description: string;
  tags?: string[];
  modules: string[];
}

export interface Module {
  module_id: string;
  title: string;
  description: string;
  order: number;
  goals: string[];
  examples?: string[];
  references?: string[];
  tasks: Task[];
  validation: ValidationRule;
  transition: TransitionRule;
  intro?: ModuleIntro;
  transition_content?: TransitionContent;
}

export interface ModuleIntro {
  hook: string;
  context: string;
  bridge: string;
  preview: string;
}

export interface TransitionContent {
  review: string;
  challenge: string;
  bridge: string;
  next_preview: string;
}

export interface Task {
  task_id: string;
  title: string;
  order: number;
  description?: string;
  steps: Record<StepKey, TaskStep>;
}

export type StepKey = "input" | "comprehend" | "verify" | "integrate" | "apply" | "feedback";

export const STEP_KEYS: StepKey[] = ["input", "comprehend", "verify", "integrate", "apply", "feedback"];

export const STEP_LABELS: Record<StepKey, string> = {
  input: "情境",
  comprehend: "小試",
  verify: "補充",
  integrate: "確認",
  apply: "實戰",
  feedback: "回顧",
};

export interface TaskStep {
  type: StepType;
  content?: string;
  prompt?: string;
  options?: string[];
  correct_answer?: string | boolean;
  min_length?: number;
  max_length?: number;
  placeholder?: string;
  evaluation: EvaluationType;
  hint?: string;
  explanation?: string;
  // AI 擴充（未來用）
  ai_evaluation_prompt?: string;
  ai_rubric?: string;
}

export type StepType =
  | "reading"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "scenario"
  | "self_reflection";

export type EvaluationType =
  | "always_pass"
  | "exact_match"
  | "length_check"
  | "contains"
  | "regex"
  | "ai_evaluate";

export interface ValidationRule {
  min_tasks_completed: "all" | number;
  min_score?: number;
  max_attempts?: number;
}

export interface TransitionRule {
  on_pass: {
    action: "unlock_next" | "unlock_specific" | "complete";
    target_module_id?: string;
    message?: string;
  };
  on_fail: {
    action: "retry" | "retry_from" | "lock";
    retry_limit?: number;
    message?: string;
  };
}
