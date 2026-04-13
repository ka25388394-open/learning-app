// AI 服務層 — 包裝 Gemini API
// 集中管理所有 AI 呼叫，方便未來換模型或加 fallback

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY && process.env.NODE_ENV === "production") {
  console.warn("[ai-service] GEMINI_API_KEY 未設定");
}

// 分級模型
const MODEL_LITE = "gemini-2.5-flash-lite";  // 免費/基礎版
const MODEL_FULL = "gemini-2.5-flash";        // 進階版

export type AiTier = "free" | "basic" | "premium";

function getModel(tier: AiTier, task: "parse" | "evaluate" | "guide"): string {
  if (tier === "premium") return MODEL_FULL;
  if (tier === "basic") {
    // 基礎版：拆解用好的，評估用輕量
    return task === "parse" ? MODEL_FULL : MODEL_LITE;
  }
  // 免費版：全部用輕量（但大部分功能不會呼叫 AI）
  return MODEL_LITE;
}

export function getAiClient() {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY 未設定");
  }
  return new GoogleGenerativeAI(API_KEY);
}

// ---- 課程拆解 ----

export interface ParseCourseInput {
  raw_content: string;
  desired_module_count?: number;
  tier?: AiTier;
}

export async function parseCourseContent(input: ParseCourseInput): Promise<string> {
  const tier = input.tier || "basic";
  const client = getAiClient();
  const model = client.getGenerativeModel({
    model: getModel(tier, "parse"),
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const moduleCount = input.desired_module_count || 2;

  const prompt = `你是一位課程設計專家。請把下面這段原始學習內容，拆解成結構化的課程 JSON 格式。

【拆解規則 — 必須嚴格遵守】
1. 根據內容主題，產生一個 Subject（學習主題）
2. 把內容拆成 ${moduleCount} 個 Module（學習模組），每個模組聚焦一個核心概念
3. 每個 Module 至少 1 個 Task（任務），每個 Task 包含固定六步驟：input, comprehend, verify, integrate, apply, feedback
4. **每個步驟的 type 必須完全按照下面的固定值，不可變動**：
   - input: type 必須是 "reading"
   - comprehend: type 必須是 "multiple_choice"，必須有 options 陣列（4 個選項，格式 "A. xxx"），correct_answer 是 "A"/"B"/"C"/"D" 其中之一
   - verify: type 必須是 "reading"
   - integrate: type 必須是 "true_false"，correct_answer 必須是 true 或 false
   - apply: type 必須是 "short_answer"，必須有 min_length，evaluation 必須是 "ai_evaluate"（讓 AI 來評估答案品質）
   - feedback: type 必須是 "self_reflection"
5. 文字風格要對話感、有共鳴，避免生硬說教
6. **絕對禁止**：在 type 是 short_answer 的步驟裡寫「以下哪個選項...」這種選擇題的題目。短答題就要問開放式問題。
7. **閱讀內容排版規則**（type=reading 的 content 欄位）：
   - 每 2-3 句話就空一行（用 \\n\\n），給眼睛呼吸空間
   - 關鍵概念用 **粗體** 標記
   - 案例或故事用 > 引用格式（Markdown blockquote）
   - 不要一大段擠在一起
   - 每段控制在 30-50 字以內

【原始內容】
${input.raw_content}

【輸出 JSON 格式範例】
{
  "subject": {
    "subject_id": "用英文小寫加底線命名",
    "title": "中文標題",
    "description": "1-2 句話描述",
    "tags": ["標籤1", "標籤2"],
    "modules": ["mod_01", "mod_02"]
  },
  "modules": [
    {
      "module_id": "mod_01",
      "title": "模組標題",
      "description": "模組描述",
      "order": 1,
      "goals": ["學習目標1", "學習目標2"],
      "examples": ["案例1", "案例2"],
      "intro": {
        "hook": "開場提問，引發共鳴的問句",
        "context": "情境描述，讓人覺得『對，我也是這樣』",
        "bridge": "點出問題根源，帶出這個模組要解決什麼",
        "preview": "預告學完之後會怎樣"
      },
      "transition_content": {
        "review": "回顧這個模組學了什麼",
        "challenge": "下一個挑戰是什麼",
        "bridge": "為什麼你準備好了",
        "next_preview": "預告下一模組"
      },
      "validation": {
        "min_tasks_completed": "all",
        "min_score": 0.6,
        "max_attempts": 3
      },
      "transition": {
        "on_pass": { "action": "unlock_next", "message": "做得好！繼續下一個。" },
        "on_fail": { "action": "retry", "retry_limit": 3, "message": "再試一次！" }
      },
      "tasks": [
        {
          "task_id": "task_01",
          "title": "任務標題",
          "order": 1,
          "steps": {
            "input": {
              "type": "reading",
              "content": "短情境，2-4 句話",
              "evaluation": "always_pass"
            },
            "comprehend": {
              "type": "multiple_choice",
              "prompt": "題目",
              "options": ["A. 選項1", "B. 選項2", "C. 選項3", "D. 選項4"],
              "correct_answer": "B",
              "evaluation": "exact_match",
              "hint": "提示",
              "explanation": "為什麼是這個答案"
            },
            "verify": {
              "type": "reading",
              "content": "補充說明，2-4 句話",
              "evaluation": "always_pass"
            },
            "integrate": {
              "type": "true_false",
              "prompt": "是非題",
              "correct_answer": false,
              "evaluation": "exact_match",
              "hint": "提示",
              "explanation": "解說"
            },
            "apply": {
              "type": "short_answer",
              "prompt": "情境應用題",
              "min_length": 30,
              "evaluation": "length_check"
            },
            "feedback": {
              "type": "self_reflection",
              "prompt": "引導反思的問題",
              "evaluation": "always_pass"
            }
          }
        }
      ]
    }
  ]
}

請直接輸出 JSON，不要加任何其他文字。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text;
}

// ---- 簡答題評估 ----

export interface EvaluateAnswerInput {
  question: string;
  answer: string;
  min_length?: number;
  rubric?: string;
  tier?: AiTier;
}

export interface EvaluationResult {
  passed: boolean;
  score: number; // 0-1
  feedback: string;
  strengths?: string[];
  suggestions?: string[];
}

export async function evaluateTextAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  const tier = input.tier || "basic";
  const client = getAiClient();
  const model = client.getGenerativeModel({
    model: getModel(tier, "evaluate"),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const prompt = `你是一位有耐心的學習引導者。請評估學生對以下問題的回答。

【題目】
${input.question}

【學生的回答】
${input.answer}

${input.rubric ? `【評分標準】\n${input.rubric}\n` : ""}

【評估規則】
1. 重點看學生有沒有**抓到問題的核心概念**，不要糾結用詞或文筆
2. 只要學生的回答方向對、有基本理解，就算通過（passed: true）
3. 回饋要像朋友在鼓勵，不要像老師在打分數
4. 如果答案有明顯錯誤或完全離題，才算不通過
5. 字數短但答得精準，也算通過
6. 字數長但全部離題，算不通過

【輸出 JSON 格式】
{
  "passed": true 或 false,
  "score": 0.0 到 1.0 之間的小數,
  "feedback": "一段溫暖的回饋，3-5 句話",
  "strengths": ["你抓到的重點 1", "你抓到的重點 2"],
  "suggestions": ["可以再補充的方向 1", "可以再補充的方向 2"]
}

請直接輸出 JSON，不要加其他文字。`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text);
    return {
      passed: !!parsed.passed,
      score: typeof parsed.score === "number" ? parsed.score : parsed.passed ? 1 : 0,
      feedback: parsed.feedback || "",
      strengths: parsed.strengths,
      suggestions: parsed.suggestions,
    };
  } catch {
    // AI 回傳格式錯誤 → 退回簡單規則
    const lengthOk = input.answer.length >= (input.min_length || 30);
    return {
      passed: lengthOk,
      score: lengthOk ? 0.7 : 0.3,
      feedback: "系統暫時無法評估，先按字數判斷。",
    };
  }
}
