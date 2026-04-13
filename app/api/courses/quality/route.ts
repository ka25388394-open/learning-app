import { NextResponse } from "next/server";
import { qualityCheck } from "@/lib/services/ai-service";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { modules, tier } = await request.json();
    const report = await qualityCheck(modules, tier);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "品質檢查失敗" },
      { status: 500 }
    );
  }
}
