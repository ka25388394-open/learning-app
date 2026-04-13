import { NextResponse } from "next/server";
import { remediate } from "@/lib/services/ai-service";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { step_prompt, correct_answer, user_answer, attempt_count, module_title, tier } = await request.json();
    const explanation = await remediate(step_prompt, String(correct_answer), user_answer, attempt_count, module_title, tier);
    return NextResponse.json({ explanation });
  } catch {
    return NextResponse.json({ explanation: "暫時無法提供補充說明，試著回去重新看一次前面的內容。" });
  }
}
