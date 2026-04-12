import { NextResponse } from "next/server";
import { evaluateTextAnswer } from "@/lib/services/ai-service";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer, min_length, rubric } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "缺少必要欄位 (question, answer)" },
        { status: 400 }
      );
    }

    const result = await evaluateTextAnswer({
      question,
      answer,
      min_length,
      rubric,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    // AI 失敗時 fallback 到字數檢查
    return NextResponse.json({
      passed: false,
      score: 0.5,
      feedback: `AI 評估暫時無法使用，請用字數判斷。錯誤：${message}`,
    });
  }
}
