// AI 服務層 — 包裝 Gemini API
// 集中管理所有 AI 呼叫，方便未來換模型或加 fallback

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY && process.env.NODE_ENV === "production") {
  console.warn("[ai-service] GEMINI_API_KEY 未設定");
}

// 預設使用便宜且快速的模型
const DEFAULT_MODEL = "gemini-2.0-flash-exp";

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
}

export async function parseCourseContent(input: ParseCourseInput): Promise<string> {
  const client = getAiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const moduleCount = input.desired_module_count || 2;

  const prompt = `你是一位課程設計專家。請把下面這段原始學習內容，拆解成結構化的課程 JSON 格式。

【拆解規則】
1. 根據內容主題，產生一個 Subject（學習主題）
2. 把內容拆成 ${moduleCount} 個 Module（學習模組），每個模組聚焦一個核心概念
3. 每個 Module 至少 1 個 Task（任務），每個 Task 包含固定六步驟：input, comprehend, verify, integrate, apply, feedback
4. 步驟設計要交錯式：input 是短情境/簡介，comprehend 是選擇題，verify 是補充說明（reading），integrate 是是非題，apply 是簡答題，feedback 是自我反思
5. 文字風格要對話感、有共鳴，避免生硬說教

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
