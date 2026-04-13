import { NextResponse } from "next/server";
import { adaptDifficulty } from "@/lib/services/ai-service";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { module_title, task_results, overall_accuracy, tier } = await request.json();
    const suggestion = await adaptDifficulty(module_title, task_results, overall_accuracy, tier);
    return NextResponse.json(suggestion);
  } catch (err) {
    return NextResponse.json(
      { difficulty_change: "same", reasoning: "無法分析", specific_adjustments: [] }
    );
  }
}
