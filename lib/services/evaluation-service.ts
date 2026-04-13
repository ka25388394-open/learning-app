// 步驟評估服務
// 根據使用者方案等級決定用規則還是 AI

import type { TaskStep, StepResult } from "@/lib/types";
import { getTier, type Tier } from "@/lib/tier-store";

// ---- 規則型評估器 ----

function ruleEvaluate(step: TaskStep, response: string): StepResult {
  const strategies: Record<string, () => StepResult> = {
    always_pass: () => ({
      response,
      passed: true,
      feedback: step.explanation || "完成！",
    }),
    exact_match: () => {
      const answer = String(step.correct_answer).toUpperCase();
      const userAnswer = response.toUpperCase().trim();
      const passed = answer === userAnswer;
      return {
        response,
        passed,
        feedback: passed
          ? step.explanation || "正確！"
          : step.hint || "答案不正確，請再想想。",
      };
    },
    length_check: () => {
      const passed = response.length >= (step.min_length || 0);
      return {
        response,
        passed,
        feedback: passed
          ? "回答已達到字數要求，很好！"
          : `回答至少需要 ${step.min_length} 字，目前只有 ${response.length} 字。`,
      };
    },
  };
  const strategy = strategies[step.evaluation];
  return strategy ? strategy() : { response, passed: true, feedback: "" };
}

// ---- AI 評估器 ----

async function aiEvaluate(step: TaskStep, response: string, tier: Tier): Promise<StepResult> {
  try {
    const res = await fetch("/api/courses/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: step.prompt || "",
        answer: response,
        min_length: step.min_length,
        rubric: step.ai_rubric,
        tier,
      }),
    });

    if (!res.ok) throw new Error("AI 評估失敗");
    const data = await res.json();

    return {
      response,
      passed: !!data.passed,
      feedback: data.feedback || "已評估完成",
    };
  } catch {
    return ruleEvaluate(step, response);
  }
}

// ---- 評估入口 ----

export function evaluateStep(step: TaskStep, response: string): StepResult | Promise<StepResult> {
  const tier = getTier();

  if (step.evaluation === "ai_evaluate") {
    // 免費版：不用 AI，退回字數檢查
    if (tier === "free") {
      return ruleEvaluate(
        { ...step, evaluation: "length_check" },
        response
      );
    }
    // 基礎版/進階版：用 AI
    return aiEvaluate(step, response, tier);
  }

  return ruleEvaluate(step, response);
}
