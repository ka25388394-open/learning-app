// 步驟評估服務
// 目前：純規則型評估
// 未來：可替換或混合 AI 評估

import type { TaskStep, StepKey, StepResult, EvaluationType } from "@/lib/types";

// ---- 評估介面（未來 AI 會實作這個介面）----

export interface StepEvaluator {
  evaluate(step: TaskStep, response: string): StepResult | Promise<StepResult>;
}

// ---- 規則型評估器（目前使用）----

export const ruleEvaluator: StepEvaluator = {
  evaluate(step: TaskStep, response: string): StepResult {
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

      contains: () => {
        // 未來：檢查是否包含關鍵字
        return { response, passed: true, feedback: "" };
      },

      regex: () => {
        // 未來：正則表達式匹配
        return { response, passed: true, feedback: "" };
      },
    };

    const strategy = strategies[step.evaluation];
    return strategy ? strategy() : { response, passed: true, feedback: "" };
  },
};

// ---- AI 評估器（預留）----

export const aiEvaluator: StepEvaluator = {
  async evaluate(step: TaskStep, response: string): Promise<StepResult> {
    // TODO: 接 AI API
    // 1. 將 step.ai_evaluation_prompt + step.ai_rubric + response 送到 AI
    // 2. AI 回傳 passed + feedback
    // 3. 記錄 AI confidence

    // 目前 fallback 到規則評估
    return ruleEvaluator.evaluate(step, response);
  },
};

// ---- 評估入口（根據 step.evaluation 決定用哪個評估器）----

export function evaluateStep(step: TaskStep, response: string): StepResult | Promise<StepResult> {
  if (step.evaluation === "ai_evaluate") {
    return aiEvaluator.evaluate(step, response);
  }
  return ruleEvaluator.evaluate(step, response);
}
