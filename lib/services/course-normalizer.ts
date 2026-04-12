// 確保 AI 拆解出的課程符合 schema
// 把錯誤的 type 修正、補上缺失欄位

import type { Subject, Module, Task, TaskStep, StepKey } from "@/lib/types";

const EXPECTED_TYPES: Record<StepKey, string> = {
  input: "reading",
  comprehend: "multiple_choice",
  verify: "reading",
  integrate: "true_false",
  apply: "short_answer",
  feedback: "self_reflection",
};

const EXPECTED_EVALUATIONS: Record<StepKey, string> = {
  input: "always_pass",
  comprehend: "exact_match",
  verify: "always_pass",
  integrate: "exact_match",
  apply: "ai_evaluate", // 讓 AI 評估簡答題品質
  feedback: "always_pass",
};

function normalizeStep(stepKey: StepKey, step: Partial<TaskStep>): TaskStep {
  const expectedType = EXPECTED_TYPES[stepKey];
  const expectedEval = EXPECTED_EVALUATIONS[stepKey];

  // 強制 type 和 evaluation
  const normalized: TaskStep = {
    ...step,
    type: expectedType as TaskStep["type"],
    evaluation: expectedEval as TaskStep["evaluation"],
  };

  // 根據 type 補上缺失欄位
  if (expectedType === "multiple_choice") {
    if (!normalized.options || normalized.options.length === 0) {
      normalized.options = ["A. 選項一", "B. 選項二", "C. 選項三", "D. 選項四"];
    }
    if (!normalized.correct_answer) {
      normalized.correct_answer = "A";
    }
    if (!normalized.prompt) {
      normalized.prompt = "請選擇正確答案";
    }
  }

  if (expectedType === "true_false") {
    if (typeof normalized.correct_answer !== "boolean") {
      normalized.correct_answer = true;
    }
    if (!normalized.prompt) {
      normalized.prompt = "判斷對錯";
    }
  }

  if (expectedType === "short_answer") {
    if (!normalized.min_length) {
      normalized.min_length = 30;
    }
    if (!normalized.prompt) {
      normalized.prompt = "請寫下你的想法";
    }
  }

  if (expectedType === "self_reflection") {
    if (!normalized.prompt) {
      normalized.prompt = "回想一下你的經驗";
    }
  }

  if (expectedType === "reading") {
    if (!normalized.content) {
      normalized.content = "（內容缺失）";
    }
  }

  return normalized;
}

function normalizeTask(task: Partial<Task>, index: number): Task {
  const steps = task.steps || ({} as Task["steps"]);
  const normalizedSteps = {} as Task["steps"];

  (["input", "comprehend", "verify", "integrate", "apply", "feedback"] as StepKey[]).forEach((key) => {
    normalizedSteps[key] = normalizeStep(key, steps[key] || ({} as Partial<TaskStep>));
  });

  return {
    task_id: task.task_id || `task_${String(index + 1).padStart(2, "0")}`,
    title: task.title || `任務 ${index + 1}`,
    order: task.order ?? index + 1,
    description: task.description,
    steps: normalizedSteps,
  };
}

function normalizeModule(mod: Partial<Module>, index: number): Module {
  return {
    module_id: mod.module_id || `mod_${String(index + 1).padStart(2, "0")}`,
    title: mod.title || `模組 ${index + 1}`,
    description: mod.description || "",
    order: mod.order ?? index + 1,
    goals: mod.goals || [],
    examples: mod.examples,
    references: mod.references,
    intro: mod.intro,
    transition_content: mod.transition_content,
    validation: mod.validation || {
      min_tasks_completed: "all",
      min_score: 0.6,
      max_attempts: 3,
    },
    transition: mod.transition || {
      on_pass: { action: "unlock_next", message: "繼續下一個！" },
      on_fail: { action: "retry", retry_limit: 3, message: "再試一次。" },
    },
    tasks: (mod.tasks || []).map((t, i) => normalizeTask(t, i)),
  };
}

export function normalizeCourse(raw: { subject: Partial<Subject>; modules: Partial<Module>[] }): {
  subject: Subject;
  modules: Module[];
} {
  const modules = (raw.modules || []).map((m, i) => normalizeModule(m, i));

  const subject: Subject = {
    subject_id: raw.subject?.subject_id || "untitled",
    title: raw.subject?.title || "未命名課程",
    description: raw.subject?.description || "",
    tags: raw.subject?.tags,
    modules: modules.map((m) => m.module_id),
  };

  return { subject, modules };
}
