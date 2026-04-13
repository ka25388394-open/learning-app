import { NextResponse } from "next/server";
import { suggestNextStep } from "@/lib/services/ai-service";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const suggestion = await suggestNextStep(body);
    return NextResponse.json({ suggestion });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "建議生成失敗" },
      { status: 500 }
    );
  }
}
